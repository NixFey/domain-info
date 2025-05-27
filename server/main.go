package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"os"
	"strconv"
	"strings"
)

type ErrorResp struct {
	Type          string   `json:"type"`
	ErrorMessages []string `json:"errors"`
}

func domainInfo(w http.ResponseWriter, req *http.Request) {
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", strings.Repeat(" ", 2))

	domain := mux.Vars(req)["domain"]
	follow, _ := strconv.ParseBool(req.URL.Query().Get("f"))
	lookupType, err := ParseLookupType(req.URL.Query().Get("t"))
	if err != nil {
		fmt.Printf("Error parsing lookup type: %v\n", err)
	}

	info, err := GetInfo(lookupType, domain, follow)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		encodeError := encoder.Encode(ErrorResp{
			Type:          "error",
			ErrorMessages: strings.Split(err.Error(), "\n"),
		})

		if encodeError != nil {
			fmt.Printf("failed to encode error, uhhhhhhhhhhhhh %s", encodeError)
		}

		return
	}

	// Set the content type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Encode the data to JSON and write it to the response
	err = encoder.Encode(info)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/info/{domain}", domainInfo).Methods("GET")

	srv := &http.Server{
		Handler: r,
		Addr:    ":3333",
	}
	fmt.Println("Listening on :3333")
	err := srv.ListenAndServe()
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
