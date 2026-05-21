import asyncio
import os
import sys
from telethon import TelegramClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
SESSION_NAME = 'scraper_session'

async def scrape_channel(channel_username, limit=10):
    if not API_ID or not API_HASH:
        print("Error: Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in a .env file.")
        return

    async with TelegramClient(SESSION_NAME, API_ID, API_HASH) as client:
        print(f"Scraping channel: {channel_username}...")
        
        # Ensure download directory exists
        os.makedirs('downloads', exist_ok=True)
        
        try:
            # Fetch the channel entity
            entity = await client.get_entity(channel_username)
            
            # Get messages
            messages = await client.get_messages(entity, limit=limit)
            
            for msg in messages:
                print("-" * 50)
                print(f"ID: {msg.id}")
                print(f"Date: {msg.date}")
                
                if msg.text:
                    print(f"Text: {msg.text[:200]}...")
                
                # Check for media (Photos)
                if msg.photo:
                    print("📷 Found photo, downloading...")
                    path = await client.download_media(msg.photo, file=f"downloads/msg_{msg.id}")
                    print(f"✅ Saved to: {path}")
                elif msg.media:
                    print("📦 Found other media (video/doc), skipping for now.")
                    
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scraper.py <channel_username>")
        sys.exit(1)
    
    target_channel = sys.argv[1]
    asyncio.run(scrape_channel(target_channel))
