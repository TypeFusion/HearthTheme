// Hearth fixture: Go semantic coverage
package main

import (
	"context"
	"net/http"
	"time"
)

type Client struct {
	BaseURL string
	Timeout time.Duration
}

func (c *Client) NewRequest(ctx context.Context, path string) (*http.Request, error) {
	url := c.BaseURL + path
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Theme", "hearth")
	return req, nil
}
