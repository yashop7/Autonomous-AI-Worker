"""
The agent's eyes and hands.

Eyes:  Playwright turns the page into text for AI (aria_snapshot with mode="ai").
       Every element gets a ref, for example:
           - textbox "Invoice date" [invalid] [ref=e71]
           - alert: Use the DD/MM/YYYY format

Hands: the LLM says "type into e71", we find it with the locator "aria-ref=e71".
"""

from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright

from . import config


class Browser:
    def start(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=config.HEADLESS)
        self.page = self.browser.new_page(viewport={"width": 1440, "height": 900})

    def close(self):
        self.browser.close()
        self.playwright.stop()

    def open(self, path: str):
        """Open a page. Only the company workspace is allowed (safety rule in code)."""
        url = urljoin(config.WORKSPACE_URL, path)
        if urlparse(url).netloc != urlparse(config.WORKSPACE_URL).netloc:
            raise ValueError(f"Not allowed: {url} is outside the company workspace")
        self.page.goto(url)

    def wait(self):
        """Wait until the page has finished loading its data."""
        try:
            self.page.wait_for_load_state("networkidle", timeout=5000)
        except Exception:
            pass  # some pages never go fully idle; that's fine
        self.page.wait_for_timeout(300)

    def read(self) -> str:
        """What the LLM sees: the current URL + the main area of the page as text."""
        self.wait()
        path = urlparse(self.page.url).path
        snapshot = self.page.locator("main").aria_snapshot(mode="ai")
        return f"URL: {path}\n{snapshot}"

    def element(self, ref: str):
        """Find an element by the ref the LLM gave us (e.g. e12)."""
        return self.page.locator(f"aria-ref={ref}")

    def screenshot(self, file):
        self.page.screenshot(path=str(file))
