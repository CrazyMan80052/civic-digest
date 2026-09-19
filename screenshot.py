import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local dev server
        await page.goto('http://localhost:3000')

        # Wait for the UI to render
        await page.wait_for_load_state('networkidle')

        # Open Sentiment Hub (Resident Pulse)
        # Looking at Navbar.tsx, it's a tab with id 'tab-nav-sentiment'
        await page.click('button#tab-nav-sentiment')

        # Intercept the API call to delay it
        async def handle_route(route):
            if '/api/sentiment/submit-microsurvey' in route.request.url:
                await asyncio.sleep(2)  # Delay for 2 seconds to capture loading state
                await route.continue_()
            else:
                await route.continue_()

        await page.route('**/*', handle_route)

        # Click the submit button inside the Sentiment Hub
        # Looking at SentimentHub.tsx, the button has text "Submit Zero-Knowledge Pulse"
        await page.click('button:has-text("Submit Zero-Knowledge Pulse")')

        # Wait a short moment to ensure the UI updates to the loading state
        await asyncio.sleep(0.5)

        # Take a screenshot
        await page.screenshot(path='/home/jules/verification/screenshots/sentiment_loading.png')

        await browser.close()

asyncio.run(main())
