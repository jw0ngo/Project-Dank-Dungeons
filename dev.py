#!/usr/bin/env python3
"""Local dev server for Dungeon Forge.

Serves index.html on http://localhost:5500 and AUTO-RELOADS the browser
every time index.html is saved. This is the fast iterate-and-test loop:

    python dev.py        # starts server + opens the game in your browser

Then just edit index.html and save — the open tab refreshes itself.
No commit and no push are needed to test; those are only for publishing
the build to GitHub Pages.

Press Ctrl+C to stop.
"""
import sys
import webbrowser

PORT = 5500
URL = f"http://localhost:{PORT}/index.html"

try:
    from livereload import Server
except ImportError:
    # Fallback: plain static server (you must refresh the browser manually with F5)
    import http.server
    import socketserver
    print("livereload not installed — falling back to a plain server.")
    print("  (auto-refresh OFF; press F5 in the browser after each save)")
    print(f"  install auto-refresh with:  python -m pip install --user livereload\n")
    print(f"Serving on {URL}  (Ctrl+C to stop)")
    webbrowser.open(URL)
    with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            sys.exit(0)
else:
    server = Server()
    server.watch("index.html")          # reload the browser when the game file changes
    print(f"Serving Dungeon Forge on {URL}")
    print("Edit + save index.html and the browser auto-refreshes. Ctrl+C to stop.\n")
    # open_url_delay opens the browser automatically a moment after the server is up
    server.serve(root=".", host="localhost", port=PORT, open_url_delay=1)
