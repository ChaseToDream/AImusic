from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    page.screenshot(path='/workspace/test_initial.png', full_page=True)
    print("=== Initial page screenshot saved ===")

    minimax_tab = page.locator('button:has-text("Minimax")')
    print(f"Minimax tab found: {minimax_tab.count() > 0}")

    if minimax_tab.count() > 0:
        print(f"Minimax tab text: {minimax_tab.first.inner_text()}")
        print(f"Minimax tab classes: {minimax_tab.first.get_attribute('class')}")

        minimax_tab.first.click()
        page.wait_for_timeout(1000)

        page.screenshot(path='/workspace/test_after_minimax_click.png', full_page=True)
        print("=== After Minimax click screenshot saved ===")

        print(f"Minimax tab classes after click: {minimax_tab.first.get_attribute('class')}")

        model_selector = page.locator('button:has-text("Music 2.6")')
        print(f"Model selector found: {model_selector.count() > 0}")

        lyrics_section = page.locator('text=歌词')
        print(f"Lyrics section found: {lyrics_section.count() > 0}")

        submit_btn = page.locator('button:has-text("Minimax 生成")')
        print(f"Submit button found: {submit_btn.count() > 0}")
        if submit_btn.count() > 0:
            print(f"Submit button disabled: {submit_btn.first.is_disabled()}")

        prompt_input = page.locator('textarea').first
        prompt_input.fill('流行音乐, 欢快, 夏天')
        page.wait_for_timeout(500)

        page.screenshot(path='/workspace/test_after_prompt.png', full_page=True)
        print("=== After prompt input screenshot saved ===")

        print(f"Submit button disabled after prompt: {submit_btn.first.is_disabled()}")

        ai_lyrics_btn = page.locator('button:has-text("AI自动写歌词")')
        print(f"AI lyrics button found: {ai_lyrics_btn.count() > 0}")

        if ai_lyrics_btn.count() > 0:
            ai_lyrics_btn.first.click()
            page.wait_for_timeout(500)

            page.screenshot(path='/workspace/test_after_lyrics_optimizer.png', full_page=True)
            print("=== After lyrics optimizer screenshot saved ===")

            print(f"Submit button disabled after lyrics optimizer: {submit_btn.first.is_disabled()}")

            if not submit_btn.first.is_disabled():
                print("Submit button is enabled! Clicking it...")
                submit_btn.first.click()
                page.wait_for_timeout(3000)
                page.screenshot(path='/workspace/test_after_submit.png', full_page=True)
                print("=== After submit screenshot saved ===")
            else:
                print("Submit button is still disabled!")

    print("\n=== Console messages ===")
    for msg in console_messages:
        print(msg)

    browser.close()
