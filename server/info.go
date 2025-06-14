package main

import (
	"errors"
	"fmt"
	"github.com/domainr/whois"
	whoisparser "github.com/likexian/whois-parser"
	"github.com/openrdap/rdap"
	"golang.org/x/net/publicsuffix"
	"net/url"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode"
)

type DomainInfo struct {
	Source                  string     `json:"source"`
	Domain                  string     `json:"domain"`
	Registrar               string     `json:"registrar"`
	Statuses                []string   `json:"statuses"`
	Nameservers             []string   `json:"nameservers"`
	CreateDate              *time.Time `json:"createDate"`
	UpdateDate              *time.Time `json:"updateDate"`
	RegistryExpirationDate  *time.Time `json:"registryExpirationDate"`
	RegistrarExpirationDate *time.Time `json:"registrarExpirationDate"`
	RegistrantName          *string    `json:"registrantName"`
	Dnssec                  bool       `json:"dnssec"`
}

type LookupType uint8

const (
	lookupAuto LookupType = iota
	lookupRdap
	lookupWhois
)

var (
	//LookupType_name = map[LookupType]string{
	//	lookupAuto:  "auto",
	//	lookupRdap:  "rdap",
	//	lookupWhois: "whois",
	//}
	LookupType_value = map[string]LookupType{
		"":      lookupAuto,
		"auto":  lookupAuto,
		"rdap":  lookupRdap,
		"whois": lookupWhois,
	}
)

func ParseLookupType(s string) (LookupType, error) {
	s = strings.TrimSpace(strings.ToLower(s))
	value, ok := LookupType_value[s]
	if !ok {
		return lookupAuto, fmt.Errorf("%q is not a valid lookup type", s)
	}
	return value, nil
}

func getTldAndSld(domain string) (string, error) {
	return publicsuffix.EffectiveTLDPlusOne(domain)
}

func GetInfo(lookupType LookupType, domain string, registrarInfo bool) (DomainInfo, error) {
	var info DomainInfo
	var err error

	domain, err = getTldAndSld(domain)
	if err != nil {
		return DomainInfo{}, err
	}

	if lookupType == lookupAuto || lookupType == lookupRdap {
		info, err = getRdapInfo(domain, registrarInfo)
		if err == nil {
			return info, err
		}
	}

	if lookupType == lookupAuto || lookupType == lookupWhois {
		info, err = getWhoisInfo(domain, registrarInfo)
		if err == nil {
			return info, err
		}
	}

	return DomainInfo{}, err
}

func getRdapInfo(domain string, registrarInfo bool) (DomainInfo, error) {
	var verboseFunc func(string)
	if s, err := strconv.ParseBool(os.Getenv("VERBOSE")); err == nil && s {
		verboseFunc = func(s string) {
			fmt.Println(s)
		}
	}

	client := &rdap.Client{
		Verbose: verboseFunc,
	}

	var rdapDomain *rdap.Domain

	rdapResp, err := client.Do(&rdap.Request{
		Type:       rdap.DomainRequest,
		Query:      domain,
		Params:     nil,
		FetchRoles: nil,
	})
	if err != nil {
		return DomainInfo{}, errors.Join(errors.New("failed to get Registry RDAP"), err)
	}

	if domain, ok := rdapResp.Object.(*rdap.Domain); ok {
		rdapDomain = domain
	} else {
		return DomainInfo{}, errors.Join(errors.New("failed to parse Registry RDAP"), err)
	}
	registryRdapDomain := rdapDomain

	registrarIdx := slices.IndexFunc(rdapDomain.Entities, func(e rdap.Entity) bool {
		return slices.Contains(e.Roles, "registrar")
	})

	registrar := ""
	registrarIanaId := 0
	if registrarIdx >= 0 {
		entity := rdapDomain.Entities[registrarIdx]
		registrar = entity.VCard.Name()

		ianaIdIdx := slices.IndexFunc(entity.PublicIDs, func(e rdap.PublicID) bool {
			return strings.ToLower(e.Type) == "iana registrar id"
		})
		if ianaIdIdx >= 0 {
			registrarIanaId, err = strconv.Atoi(entity.PublicIDs[ianaIdIdx].Identifier)
		}
	}

	if registrarInfo {
		registrarIdx := slices.IndexFunc(rdapDomain.Links, func(e rdap.Link) bool {
			return e.Rel == "related"
		})

		registrar := ""
		if registrarIdx >= 0 {
			registrar = rdapDomain.Links[registrarIdx].Href
			registrarUrl, err := url.Parse(registrar)

			if err != nil {
				return DomainInfo{}, errors.Join(errors.New("failed to parse registrar URL"), err)
			}

			rdapResp, err = client.Do(&rdap.Request{
				Type:       rdap.RawRequest, // We already have the full URL, don't append anything
				Query:      domain,
				Params:     nil,
				Server:     registrarUrl,
				FetchRoles: nil,
			})

			if err != nil {
				if rdapResp != nil {
					if rErr, ok := rdapResp.Object.(*rdap.Error); ok {
						messages := []string{}
						messages = append(messages, rErr.Title)
						messages = slices.Concat(messages, rErr.Description)
						return DomainInfo{}, errors.Join(errors.New("failed to fetch registrar RDAP"), errors.New(strings.Join(messages, ";")))
					}
				}
				return DomainInfo{}, errors.Join(errors.New("failed to fetch registrar RDAP"), err)
			}

			if domain, ok := rdapResp.Object.(*rdap.Domain); ok {
				rdapDomain = domain
			}
		}

	}

	var nameservers []string

	for _, ns := range rdapDomain.Nameservers {
		nameservers = append(nameservers, ns.LDHName)
	}

	var created *time.Time
	var updated *time.Time
	var registryExpirationDate *time.Time
	var registrarExpirationDate *time.Time

	for _, evt := range rdapDomain.Events {
		eventTime, err := time.Parse(time.RFC3339, evt.Date)
		if err != nil {
			return DomainInfo{}, errors.Join(errors.New("failed to parse event"), err)
		}
		if evt.Action == "registration" {
			created = &eventTime
		} else if evt.Action == "expiration" && registrarInfo {
			registrarExpirationDate = &eventTime
		} else if evt.Action == "last changed" {
			updated = &eventTime
		}
	}

	for _, evt := range registryRdapDomain.Events {
		eventTime, err := time.Parse(time.RFC3339, evt.Date)
		if err != nil {
			return DomainInfo{}, errors.Join(errors.New("failed to parse event"), err)
		}
		if evt.Action == "expiration" {
			registryExpirationDate = &eventTime
		}
	}

	dnssec := rdapDomain.SecureDNS.DelegationSigned != nil && (*rdapDomain.SecureDNS.DelegationSigned)

	registrantIdx := slices.IndexFunc(rdapDomain.Entities, func(e rdap.Entity) bool {
		return slices.Contains(e.Roles, "registrant")
	})

	var registrantName *string
	if registrantIdx >= 0 {
		registrant := rdapDomain.Entities[registrantIdx].VCard
		if registrant != nil {
			if registrant.Name() != "" {
				name := registrant.Name()
				registrantName = &name
			} else {
				org := registrant.GetFirst("org")
				if org != nil && registrant.GetFirst("org").String() != "" {
					name := registrant.GetFirst("org").String()
					registrantName = &name
				}
			}
		}
	}

	return DomainInfo{
		Source:                  fmt.Sprintf("RDAP (%s)", rdapResp.HTTP[0].URL),
		Domain:                  domain,
		Registrar:               fmt.Sprintf("%s (IANA %d)", registrar, registrarIanaId),
		RegistrantName:          registrantName,
		Statuses:                rdapDomain.Status,
		Nameservers:             nameservers,
		CreateDate:              created,
		UpdateDate:              updated,
		RegistryExpirationDate:  registryExpirationDate,
		RegistrarExpirationDate: registrarExpirationDate,
		Dnssec:                  dnssec,
	}, nil
}

func getWhoisInfo(domain string, registrarInfo bool) (DomainInfo, error) {
	whoisClient := whois.NewClient(time.Duration(10) * time.Second)
	request, err := whois.NewRequest(domain)
	if err != nil {
		return DomainInfo{}, errors.Join(errors.New("failed to create Whois request"), err)
	}
	result, err := whoisClient.Fetch(request)
	if err != nil {
		return DomainInfo{}, errors.Join(errors.New("failed to get Whois info"), err)
	}

	parsedWhois, err := whoisparser.Parse(result.String())
	if err != nil {
		return DomainInfo{}, errors.Join(errors.New("failed to parse Whois request"), err)
	}

	parsedRegistryWhois := parsedWhois

	if parsedWhois.Domain.WhoisServer != "" && registrarInfo {
		cleanHost := strings.TrimFunc(parsedWhois.Domain.WhoisServer, func(r rune) bool {
			return r == '/' || unicode.IsSpace(r)
		})
		request, err := whois.NewRequest(domain)
		request.Host = cleanHost
		if err != nil {
			return DomainInfo{}, errors.Join(errors.New("failed to create registrar Whois request"), err)
		}
		result, err = whoisClient.Fetch(request)
		if err != nil {
			return DomainInfo{}, errors.Join(errors.New("failed to get registrar Whois info"), err)
		}

		parsedWhois, err = whoisparser.Parse(result.String())
		if err != nil {
			return DomainInfo{}, errors.Join(errors.New("failed to parse registrar Whois request"), err)
		}
	}

	if parsedWhois.Domain == nil {
		return DomainInfo{}, errors.New("no domain in parsed Whois info")
	}

	var registrantName *string
	if parsedWhois.Registrant != nil && parsedWhois.Registrant.Name != "" {
		registrantName = &parsedWhois.Registrant.Name
	}

	var registrarExpirationDate *time.Time
	if registrarInfo {
		registrarExpirationDate = parsedWhois.Domain.ExpirationDateInTime
	}

	return DomainInfo{
		Source:                  fmt.Sprintf("WHOIS (%s)", result.Host),
		Domain:                  domain,
		Registrar:               parsedRegistryWhois.Registrar.Name,
		RegistrantName:          registrantName,
		Statuses:                parsedWhois.Domain.Status,
		Nameservers:             parsedWhois.Domain.NameServers,
		CreateDate:              parsedWhois.Domain.CreatedDateInTime,
		UpdateDate:              parsedWhois.Domain.UpdatedDateInTime,
		RegistryExpirationDate:  parsedRegistryWhois.Domain.ExpirationDateInTime,
		RegistrarExpirationDate: registrarExpirationDate,
		Dnssec:                  parsedWhois.Domain.DNSSec,
	}, nil
}
