import re
import os

with open("work/PROJECT-25-material.txt", "r") as f:
    text = f.read()

# Pattern explanation:
# We look for a line that starts with uppercase letters, may have spaces, quotes, hyphens.
# Followed by difficulty rating.
# Example: "DARIUS HARD/BAN" or "MALPHITE EASY"
# Note that the first line is header. We'll skip it.

# Split by newlines, keep track of current champion and content
lines = text.split("\n")
current_champ = None
content = []

champions = {}

for line in lines[1:]: # Skip header
    line = line.strip()
    if not line:
        continue
    
    # Check if line is a champion header
    match = re.match(r'^([A-Z\ \'\-]+)\ (EASY|MEDIUM|HARD|VERY HARD|HARD/BAN|SKILL MATCHUP)$', line)
    if match:
        if current_champ:
            champions[current_champ] = "\n".join(content).strip()
        
        champ_name = match.group(1).strip()
        difficulty = match.group(2).strip()
        
        # Titlecase champion name, remove spaces/apostrophes for folder name
        # e.g., "K'SANTE" -> "KSante", "DR MUNDO" -> "DrMundo", "CHO'GATH" -> "Chogath"
        if champ_name == "K'SANTE":
            current_champ = "KSante"
        elif champ_name == "DR MUNDO":
            current_champ = "DrMundo"
        elif champ_name == "CHO'GATH":
            current_champ = "Chogath"
        else:
            # Just capitalize first letter, lower rest
            current_champ = champ_name.capitalize()
            
        content = [line]
    elif current_champ:
        content.append(line)

if current_champ:
    champions[current_champ] = "\n".join(content).strip()

print(f"Parsed {len(champions)} champions")

# Create folders and files
for champ, champ_content in champions.items():
    # Make sure we use correct capitalization for folder
    folder = f"matchups/{champ}"
    if not os.path.exists(folder):
        os.makedirs(folder)
        print(f"Created folder {folder}")
    
    # We are Garen against them
    file_path = f"{folder}/Garen-reference.md"
    
    # Write the content
    with open(file_path, "w") as f:
        f.write(champ_content)
        
print("Done")
