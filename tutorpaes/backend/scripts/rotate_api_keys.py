#!/usr/bin/env python
"""
Helper script to rotate API keys safely.

Usage:
    python rotate_api_keys.py --provider openai --new-key sk-proj-...
    python rotate_api_keys.py --provider groq --new-key gsk-...
    python rotate_api_keys.py --show-status openai
"""
import argparse
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.key_management import KeyManager, get_key_manager


def rotate_key(provider: str, new_key: str, dry_run: bool = False) -> None:
    """
    Rotate API key for a provider.
    
    Args:
        provider: Provider name (openai, groq, cerebras, transbank)
        new_key: New API key value
        dry_run: If True, only show what would happen
    """
    try:
        manager = get_key_manager(provider)
    except ValueError as e:
        print(f"❌ Error: {e}")
        return
    
    print(f"\n{'='*70}")
    print(f"🔄 API Key Rotation for {provider.upper()}")
    print(f"{'='*70}\n")
    
    # Show current status
    print("📊 Current Status:")
    for version, key_data in manager._versions.items():
        key_preview = key_data.key[:15] + "..." if len(key_data.key) > 15 else key_data.key
        expires = ""
        if key_data.grace_period_expires_at:
            expires = f" (expires: {key_data.grace_period_expires_at.strftime('%Y-%m-%d')})"
        print(f"  • {version}: {key_data.status}{expires}")
        print(f"    Key: {key_preview}")
    
    if not manager._versions:
        print("  (No versioned keys found - using non-versioned)")
    
    # Calculate new version
    if manager._versions:
        max_version_num = max(
            int(v.lstrip('v')) for v in manager._versions.keys()
        )
        new_version = f"v{max_version_num + 1}"
    else:
        new_version = "v0"
    
    print(f"\n🔑 New Key Details:")
    print(f"  Version: {new_version}")
    new_key_preview = new_key[:15] + "..." if len(new_key) > 15 else new_key
    print(f"  Key: {new_key_preview}")
    grace_period_expires = datetime.now() + timedelta(days=7)
    print(f"  Grace period: 7 days (expires {grace_period_expires.strftime('%Y-%m-%d')})")
    
    print(f"\n📝 Rotation Plan:")
    for version, key_data in manager._versions.items():
        if key_data.status == "active":
            print(f"  1. Mark {version} as deprecated (grace period: 7 days)")
    print(f"  2. Activate {new_version} as new active key")
    
    if dry_run:
        print(f"\n⚠️  DRY RUN MODE - No changes made")
        return
    
    # Confirm before proceeding
    print(f"\n⚠️  This will rotate the production key!")
    confirm = input("Continue with rotation? (type 'yes' to confirm): ").strip().lower()
    
    if confirm != "yes":
        print("❌ Rotation cancelled")
        return
    
    # Perform rotation
    try:
        actual_new_version = manager.rotate_key(new_key)
        
        print(f"\n✅ Rotation Successful!")
        print(f"\n📋 Next Steps:")
        print(f"  1. Update environment variable:")
        print(f"     {provider.upper()}_API_KEY_V{new_version[1:]} = {new_key_preview}...")
        print(f"  2. Deploy to production")
        print(f"  3. Verify API calls working (check logs)")
        print(f"  4. Monitor for 24 hours")
        print(f"  5. After grace period ({grace_period_expires.strftime('%Y-%m-%d')}):")
        print(f"     - Remove old key environment variable")
        print(f"     - Revoke key at provider console")
        
    except Exception as e:
        print(f"❌ Rotation failed: {e}")


def show_status(provider: str) -> None:
    """Show current key status for a provider."""
    try:
        manager = get_key_manager(provider)
    except ValueError as e:
        print(f"❌ Error: {e}")
        return
    
    print(f"\n{'='*70}")
    print(f"🔍 Key Status for {provider.upper()}")
    print(f"{'='*70}\n")
    
    # Active key
    try:
        active = manager.get_active_key()
        active_preview = active[:15] + "..." if len(active) > 15 else active
        print(f"✅ Active Key: {active_preview}")
    except ValueError as e:
        print(f"❌ No active key: {e}")
        return
    
    # All versions
    print(f"\n📦 All Versions:")
    if not manager._versions:
        print("  (No versioned keys configured)")
    
    for version in sorted(manager._versions.keys()):
        key_data = manager._versions[version]
        status_icon = "✅" if key_data.status == "active" else "⏳" if key_data.status == "deprecated" else "❌"
        key_preview = key_data.key[:15] + "..." if len(key_data.key) > 15 else key_data.key
        
        expires_info = ""
        if key_data.grace_period_expires_at:
            days_left = (key_data.grace_period_expires_at - datetime.now()).days
            expires_info = f" (grace period expires in {days_left} days)"
        
        print(f"  {status_icon} {version}: {key_data.status}{expires_info}")
        print(f"     Key: {key_preview}")
        print(f"     Created: {key_data.created_at.strftime('%Y-%m-%d %H:%M UTC')}")
        if key_data.rotated_at:
            print(f"     Rotated: {key_data.rotated_at.strftime('%Y-%m-%d %H:%M UTC')}")
    
    # Rotation schedule
    print(f"\n📅 Rotation Schedule:")
    print(f"  Production: Every 90 days")
    print(f"  Staging: Every 120 days")
    print(f"  Sandbox: Every 180 days")
    print(f"\n  See DOCS/API_KEY_ROTATION_POLICY.md for details")


def list_providers() -> None:
    """List all available providers."""
    print("Available providers:")
    print("  • openai      - OpenAI GPT models")
    print("  • groq        - Groq Mixtral models")
    print("  • cerebras    - Cerebras LLaMA models")
    print("  • transbank   - Transbank WebPay Plus")


def main():
    parser = argparse.ArgumentParser(
        description="Rotate API keys safely with versioning support",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Show current key status
  %(prog)s --show-status openai
  
  # Dry run (show what would happen)
  %(prog)s --provider openai --new-key sk-proj-... --dry-run
  
  # Rotate key (prompts for confirmation)
  %(prog)s --provider openai --new-key sk-proj-...
  
  # List available providers
  %(prog)s --list-providers
        """
    )
    
    parser.add_argument(
        "--provider",
        choices=["openai", "groq", "cerebras", "transbank"],
        help="Provider to rotate key for"
    )
    parser.add_argument(
        "--new-key",
        help="New API key value"
    )
    parser.add_argument(
        "--show-status",
        metavar="PROVIDER",
        help="Show current key status for provider"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would happen without making changes"
    )
    parser.add_argument(
        "--list-providers",
        action="store_true",
        help="List available providers"
    )
    
    args = parser.parse_args()
    
    # Handle different commands
    if args.list_providers:
        list_providers()
    elif args.show_status:
        show_status(args.show_status)
    elif args.provider and args.new_key:
        rotate_key(args.provider, args.new_key, dry_run=args.dry_run)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
