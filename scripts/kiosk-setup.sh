#!/usr/bin/env bash
# NextNamaz Kiosk Setup Script for Raspberry Pi
# Installs dependencies and configures auto-start in kiosk mode.
#
# Usage:
#   chmod +x kiosk-setup.sh
#   NEXTNAMAZ_URL="https://nextnamaz.com/display" ./display-setup.sh

set -euo pipefail

NEXTNAMAZ_URL="${NEXTNAMAZ_URL:-https://nextnamaz.com/display}"
AUTOSTART_DIR="$HOME/.config/autostart"
AUTOSTART_FILE="$AUTOSTART_DIR/nextnamaz-kiosk.desktop"

echo "==> NextNamaz Kiosk Setup"
echo "    URL: $NEXTNAMAZ_URL"
echo ""

# Install dependencies
echo "==> Installing packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq chromium-browser unclutter xdotool

# Create kiosk launch script
KIOSK_SCRIPT="$HOME/.local/bin/nextnamaz-kiosk.sh"
mkdir -p "$(dirname "$KIOSK_SCRIPT")"

cat > "$KIOSK_SCRIPT" << 'INNER'
#!/usr/bin/env bash
set -euo pipefail

NEXTNAMAZ_URL="${NEXTNAMAZ_URL:-https://nextnamaz.com/display}"

# Disable screen blanking and power management
xset s off
xset s noblank
xset -dpms

# Hide cursor after 3 seconds of inactivity
unclutter -idle 3 -root &

# Clear Chromium crash flags so it doesn't show restore prompts
CHROMIUM_DIR="$HOME/.config/chromium/Default"
if [ -f "$CHROMIUM_DIR/Preferences" ]; then
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_DIR/Preferences" 2>/dev/null || true
  sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_DIR/Preferences" 2>/dev/null || true
fi

# Launch Chromium in kiosk mode (no incognito — localStorage must persist)
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --no-first-run \
  --disable-translate \
  --disable-features=TranslateUI \
  --check-for-update-interval=31536000 \
  "$NEXTNAMAZ_URL"
INNER

chmod +x "$KIOSK_SCRIPT"

# Create autostart entry
mkdir -p "$AUTOSTART_DIR"

cat > "$AUTOSTART_FILE" << EOF
[Desktop Entry]
Type=Application
Name=NextNamaz Kiosk
Exec=$KIOSK_SCRIPT
X-GNOME-Autostart-enabled=true
EOF

echo ""
echo "==> Setup complete!"
echo "    Kiosk script: $KIOSK_SCRIPT"
echo "    Autostart:    $AUTOSTART_FILE"
echo ""
echo "    Reboot to start the kiosk, or run:"
echo "    $KIOSK_SCRIPT"
