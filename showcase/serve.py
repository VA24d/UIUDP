"""Zero-cache static file server for dev. Bypasses browser ES-module caching
by setting Cache-Control: no-store on every response.

Usage:  python3 serve.py [port]   (default 8091)
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8091
    print(f"Serving on http://localhost:{port} with no-cache headers")
    HTTPServer(("", port), NoCacheHandler).serve_forever()
