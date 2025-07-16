package main

import (
	"cmp"
	"errors"
	"fmt"
	"github.com/miekg/dns"
	"math/rand"
	"net"
	"slices"
	"strconv"
	"strings"
)

type DnsRecord struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Data string `json:"data"`
	Ttl  uint32 `json:"ttl"`
}

func GetDnsRecordsFromNs(hostname string, nameservers []string, deep bool) (map[string][]DnsRecord, error) {
	var ips []net.IP
	for _, nameserver := range nameservers {
		resp, _ := net.LookupIP(nameserver)

		ips = append(ips, resp...)
	}

	ips = slices.DeleteFunc(ips, func(ip net.IP) bool {
		return ip.To4() == nil
	})

	if ips == nil || len(ips) == 0 {
		return nil, errors.New("failed to get ip for nameservers")
	}
	return GetDnsRecordsFromIp(hostname, ips, deep)
}

func GetDnsRecordsFromIp(hostname string, ips []net.IP, deep bool) (map[string][]DnsRecord, error) {
	c := new(dns.Client)

	if !deep {
		rand.Shuffle(len(ips), func(i, j int) {
			ips[i], ips[j] = ips[j], ips[i]
		})
		for _, ip := range ips {
			retMap := make(map[string][]DnsRecord)
			res, err := getDnsRecords(c, hostname, ip)
			if err != nil {
				continue
			}

			retMap[ip.String()] = res

			return retMap, nil
		}
	}

	retMap := make(map[string][]DnsRecord)
	errs := make([]error, 0, len(ips))
	for _, ip := range ips {
		res, err := getDnsRecords(c, hostname, ip)
		if err != nil {
			errs = append(errs, err)
		}

		retMap[ip.String()] = res
	}

	if len(errs) > 0 {
		return nil, errors.Join(errs...)
	}

	fmt.Println(retMap)
	return retMap, nil
}

func getDnsRecords(client *dns.Client, hostname string, addr net.IP) ([]DnsRecord, error) {
	hostname = strings.TrimSuffix(hostname, ".") + "."
	server := net.JoinHostPort(addr.String(), "53")

	const numQuestions = 8
	errCh := make(chan error, numQuestions)
	ansCh := make(chan []dns.RR, numQuestions)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeA, Qclass: dns.ClassINET}, ansCh, errCh)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeAAAA, Qclass: dns.ClassINET}, ansCh, errCh)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeCNAME, Qclass: dns.ClassINET}, ansCh, errCh)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeTXT, Qclass: dns.ClassINET}, ansCh, errCh)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeMX, Qclass: dns.ClassINET}, ansCh, errCh)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeSOA, Qclass: dns.ClassINET}, ansCh, errCh)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeDS, Qclass: dns.ClassINET}, ansCh, errCh)
	go askQuestion(client, server, dns.Question{Name: hostname, Qtype: dns.TypeDNSKEY, Qclass: dns.ClassINET}, ansCh, errCh)

	var errs []error
	for range numQuestions {
		err := <-errCh
		if err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return nil, errors.Join(errs...)
	}

	var records []DnsRecord
	for range numQuestions {
		ans := <-ansCh

		for _, rr := range ans {
			name := strings.TrimSuffix(rr.Header().Name, hostname)
			if name == "" {
				name = "@"
			}
			records = append(records, DnsRecord{
				Name: name,
				Type: dns.TypeToString[rr.Header().Rrtype],
				Data: getRecordData(rr),
				Ttl:  rr.Header().Ttl,
			})
		}
	}

	slices.SortFunc(records, func(a DnsRecord, b DnsRecord) int {
		typeCompare := cmp.Compare(a.Type, b.Type)
		if typeCompare != 0 {
			return typeCompare
		}

		return cmp.Compare(a.Data, b.Data)
	})

	return slices.Compact(records), nil
}

func getRecordData(rr dns.RR) string {
	if a, ok := rr.(*dns.A); ok {
		return a.A.String()
	} else if aaaa, ok := rr.(*dns.AAAA); ok {
		return aaaa.AAAA.String()
	} else if cname, ok := rr.(*dns.CNAME); ok {
		return cname.Target
	} else if txt, ok := rr.(*dns.TXT); ok {
		return strings.Join(txt.Txt, ", ")
	} else if mx, ok := rr.(*dns.MX); ok {
		return fmt.Sprintf("%s (priority %d)", mx.Mx, mx.Preference)
	} else if soa, ok := rr.(*dns.SOA); ok {
		return soa.Ns + " " + soa.Mbox +
			" " + strconv.FormatInt(int64(soa.Serial), 10) +
			" " + strconv.FormatInt(int64(soa.Refresh), 10) +
			" " + strconv.FormatInt(int64(soa.Retry), 10) +
			" " + strconv.FormatInt(int64(soa.Expire), 10) +
			" " + strconv.FormatInt(int64(soa.Minttl), 10)
	} else if ds, ok := rr.(*dns.DS); ok {
		return strconv.Itoa(int(ds.KeyTag)) +
			" " + strconv.Itoa(int(ds.Algorithm)) +
			" " + strconv.Itoa(int(ds.DigestType)) +
			" " + strings.ToUpper(ds.Digest)
	} else if dnskey, ok := rr.(*dns.DNSKEY); ok {
		return strconv.Itoa(int(dnskey.Flags)) +
			" " + strconv.Itoa(int(dnskey.Protocol)) +
			" " + strconv.Itoa(int(dnskey.Algorithm)) +
			" " + dnskey.PublicKey
	}

	return rr.String()
}

func askQuestion(client *dns.Client, server string, question dns.Question, ansCh chan<- []dns.RR, errCh chan<- error) {
	m := new(dns.Msg)
	m.SetEdns0(4096, true)
	m.RecursionDesired = true
	m.Question = make([]dns.Question, 1)
	m.Question[0] = question

	resp, _, err := client.Exchange(m, server)

	if err != nil {
		ansCh <- []dns.RR{}
		errCh <- err
		return
	}

	errCh <- nil
	ansCh <- resp.Answer
}
