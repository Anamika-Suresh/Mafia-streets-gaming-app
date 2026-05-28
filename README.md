# Mafia Streets - Underworld Syndicate RPG
Rebranded and enhanced from *Mumbai Mafia*. Built with **Apache Cordova** + **Ext JS** classic theme.

---

## 📱 Mobile App Demo
Watch the gameplay demonstration running natively on an Android device:

[🎥 Watch App Working In Android Video (App_Working_In_Android.mp4)](https://github.com/Anamika-Suresh/Mafia-streets-gaming-app/blob/main/App_Working_In_Android.mp4)

*(Alternatively, you can play the video file directly below:)*

<video src="App_Working_In_Android.mp4" width="100%" controls></video>

---

## 🌟 Implemented Features

### 1. Rebranding & UI Aesthetics
* **Rebranding**: Rethemed all references to **Mafia Streets**, character classes, locations, and dialogues.
* **Animated Logo**: Replaced the static logo with a letter-by-letter CSS-animated title. Individual letters float, jump in sequence, and spin on cursor hover. It features a neon shine and radial underworld pulse glow.
* **Movable Character Selection**: Interactive selection cards for choosing between **Maya** and **Vikra**:
  * **3D Tilt Hover**: Hovering over cards tilts them dynamically in 3D perspective space based on the mouse pointer position.
  * **Breathing Float**: Cards float passively with sinusoidal waves (each character has different wave delays for natural movement).
  * **Rubber-Band Dragging**: Cards can be clicked/touched and dragged around the screen freely, springing back to their slots with a physical snap transition on release.

### 2. Gameplay Mechanics
* **Character Archetypes**:
  * **Maya (The Mastermind)**: Starts with Lathi (equipped), 60 max energy, base attack 12, defense 15. Special: *Calculated Strike* (bypasses defense, double damage, restores +10 energy, 3-turn cooldown).
  * **Vikra (The Enforcer)**: Starts with Lathi (equipped), 120 max HP, base attack 18, defense 8. Special: *Underworld Rage* (+50% attack power for 2 turns, +15 HP instant heal, 3-turn cooldown).
* **HTML5 Synthesized Audio**: Built a `SoundFX` class using the browser's native **Web Audio API** to dynamically synthesize retro chimes:
  * *Combat Hit*: Low-frequency sweep.
  * *Healing Chime*: Rising arpeggio chord.
  * *Victory*: Major triad fanfare.
  * *Defeat*: Somber low descending sweep.
  * *Level Up*: Rising C-scale bells.
  * *Bribe/Select*: Metallic coin tinkle.
* **Corrupt Cop Street Encounter**: Raid actions on territories have a 25% chance of triggering **Inspector Shinde**, who demands a ₹80 bribe. Pay to escape safely (gain +30 EXP) or fight him in a mini-boss fight.
* **Dashboard Gossip Ticker**: Horizontal marquee footer showcasing syndicate news updates.

---

## 🚀 How to Run the Project

The workspace includes the pre-compiled APK, source archive, and a live public browser link:
* **Live Public Browser Link**: [http://mafia-streets-mumbai.surge.sh](http://mafia-streets-mumbai.surge.sh) (Backup: [http://mafia-streets-game.surge.sh](http://mafia-streets-game.surge.sh)) (Perfect for your mentor to open immediately on any device!)
* **Android APK**: `mafia-streets.apk` (directly installable on emulator/devices)
* **Clean Source Archive**: `mafia-streets-project.zip` (clean project code without `platforms` and `node_modules` folders)

### Setup & Local Development (Browser)
1. **Pre-requisites**: Ensure you use the portable Node environment located in the workspace.
2. **Launch Dev Server**:
   ```powershell
   # Prepend node-portable to path
   $env:PATH = "C:\Users\ANAMIKA\Desktop\Game_APP\node-portable;" + $env:PATH
   
   # Navigate to the project directory
   cd C:\Users\ANAMIKA\Desktop\Game_APP\mumbai-mafia
   
   # Run local browser test server
   node C:\Users\ANAMIKA\Desktop\Game_APP\node_modules\cordova\bin\cordova run browser
   ```
3. **Open browser**: Go to `http://localhost:8000/index.html` to play.

### Android Compile Steps (If rebuilding)
To compile the project from the source:
```powershell
# Set environment path to include portable tools (Node, JDK 21, Gradle 8.5, Android SDK tools)
$env:PATH = "C:\Users\ANAMIKA\Desktop\Game_APP\node-portable;C:\Users\ANAMIKA\Desktop\Game_APP\jdk21\jdk-21.0.11+10\bin;C:\Users\ANAMIKA\Desktop\Game_APP\gradle\gradle-8.5\bin;C:\Users\ANAMIKA\AppData\Local\Android\Sdk\cmdline-tools\latest\bin;C:\Users\ANAMIKA\AppData\Local\Android\Sdk\platform-tools;" + $env:PATH

# Configure home variables
$env:JAVA_HOME = "C:\Users\ANAMIKA\Desktop\Game_APP\jdk21\jdk-21.0.11+10"
$env:ANDROID_HOME = "C:\Users\ANAMIKA\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\ANAMIKA\AppData\Local\Android\Sdk"

# Navigate to project
cd C:\Users\ANAMIKA\Desktop\Game_APP\mumbai-mafia

# Build APK
node C:\Users\ANAMIKA\Desktop\Game_APP\node_modules\cordova\bin\cordova build android
```

---

## 🛠️ Challenges Faced & Resolutions

1. **Portable Node Path**: Global `node`/`npm` commands were not registered. Resolved by prepending `"C:\Users\ANAMIKA\Desktop\Game_APP\node-portable;"` to the `$env:PATH` environment inside the execution shell scripts.
2. **Missing SDK Requirements**: The machine lacked Java compilers, Android target platforms, and build tools.
   * Installed `cmdline-tools/latest` and `platform-tools` via `android.exe sdk install`.
   * Installed `platforms/android-36` and `build-tools/36.0.0` to match Cordova 15 target requirements.
3. **Jlink / JRE Compilation Failure**: The build failed at `compileDebugJavaWithJavac` because the configured RedHat Java extension was a JRE without modular compilation binaries like `jlink.exe`.
   * **Resolution**: Downloaded and unpacked a portable Eclipse Temurin OpenJDK 21 archive to `C:\Users\ANAMIKA\Desktop\Game_APP\jdk21` and pointed `JAVA_HOME` to it, providing all required build tools.
4. **Missing Gradle Build System**: Building android apps requires a Gradle daemon.
   * **Resolution**: Downloaded and unpacked portable Gradle 8.5 to `C:\Users\ANAMIKA\Desktop\Game_APP\gradle`, adding its `bin` directory to the shell execution path.
