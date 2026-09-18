import json
import os

CHAR_FILE = "data/characters.json"
REL_FILE = "data/relationships.json"

with open(CHAR_FILE, 'r', encoding='utf-8') as f:
    chars = json.load(f)

with open(REL_FILE, 'r', encoding='utf-8') as f:
    rels = json.load(f)

new_chars = {
    "kazui": {"name": "Kazui Kurosaki", "race": "Hybrid", "family": "Kurosaki", "faction": "Human World", "description": "Son of Ichigo and Orihime.", "generation": 3},
    "orihime": {"name": "Orihime Inoue", "race": "Human", "family": "Inoue", "faction": "Human World", "description": "Possesses Shun Shun Rikka. Married to Ichigo.", "generation": 2},
    "chad": {"name": "Yasutora Sado", "race": "Fullbringer", "family": "Sado", "faction": "Human World", "description": "Ichigo's close friend. Possesses Fullbring arms.", "generation": 2},
    
    "kanae": {"name": "Kanae Katagiri", "race": "Quincy", "family": "Ishida", "faction": "Quincy", "description": "Gemischt Quincy, maid of the Ishida family, wife of Ryuken.", "generation": 1},
    "izumi": {"name": "Izumi Ishida", "race": "Quincy", "family": "Ishida", "faction": "Quincy", "description": "Wife of Soken Ishida and mother of Ryuken.", "generation": 0},
    
    "urahara": {"name": "Kisuke Urahara", "race": "Soul Reaper", "family": "Unknown", "faction": "Urahara Shop", "description": "Former Squad 12 Captain, founder of the SRDI, currently shop owner.", "generation": 1},
    "yoruichi": {"name": "Yoruichi Shihoin", "race": "Noble", "family": "Shihoin", "faction": "Urahara Shop", "description": "Former 22nd Head of the Shihoin Clan, former Squad 2 Captain.", "generation": 1},
    "tessai": {"name": "Tessai Tsukabishi", "race": "Soul Reaper", "family": "Unknown", "faction": "Urahara Shop", "description": "Former Captain of the Kido Corps.", "generation": 1},
    "jinta": {"name": "Jinta Hanakari", "race": "Human", "family": "Unknown", "faction": "Urahara Shop", "description": "Employee at the Urahara Shop.", "generation": 2},
    "ururu": {"name": "Ururu Tsumugiya", "race": "Human", "family": "Unknown", "faction": "Urahara Shop", "description": "Employee at the Urahara Shop.", "generation": 2},
    "ririn": {"name": "Ririn", "race": "Mod Soul", "family": "Mod Soul", "faction": "Urahara Shop", "description": "Modified Soul created by Urahara.", "generation": 2},
    "noba": {"name": "Noba", "race": "Mod Soul", "family": "Mod Soul", "faction": "Urahara Shop", "description": "Quiet Modified Soul.", "generation": 2},
    "kurodo": {"name": "Kurodo", "race": "Mod Soul", "family": "Mod Soul", "faction": "Urahara Shop", "description": "Theatrical Modified Soul.", "generation": 2},
    
    "ginjo": {"name": "Kugo Ginjo", "race": "Fullbringer", "family": "Unknown", "faction": "Xcution", "description": "First Substitute Soul Reaper and leader of Xcution.", "generation": 1},
    "tsukishima": {"name": "Shukuro Tsukishima", "race": "Fullbringer", "family": "Unknown", "faction": "Xcution", "description": "Former leader of Xcution, wields Book of the End.", "generation": 2},
    "riruka": {"name": "Riruka Dokugamine", "race": "Fullbringer", "family": "Unknown", "faction": "Xcution", "description": "Wields Dollhouse.", "generation": 2},
    "yukio": {"name": "Yukio Hans Vorarlberna", "race": "Fullbringer", "family": "Unknown", "faction": "Xcution", "description": "Wields Invaders Must Die.", "generation": 2},
    "jackie": {"name": "Jackie Tristan", "race": "Fullbringer", "family": "Unknown", "faction": "Xcution", "description": "Wields Dirty Boots.", "generation": 2},
    "moe": {"name": "Moe Shishigawara", "race": "Fullbringer", "family": "Unknown", "faction": "Xcution", "description": "Tsukishima's follower. Wields Jackpot Knuckle.", "generation": 2},
    "giriko": {"name": "Giriko Kutsuzawa", "race": "Fullbringer", "family": "Unknown", "faction": "Xcution", "description": "Wields Time Tells No Lies.", "generation": 1},
    
    "tatsuki": {"name": "Tatsuki Arisawa", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Orihime's best friend and martial artist.", "generation": 2},
    "keigo": {"name": "Keigo Asano", "race": "Human", "family": "Asano", "faction": "Karakura High", "description": "Ichigo's energetic classmate.", "generation": 2},
    "mizuiro": {"name": "Mizuiro Kojima", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Ichigo's calm classmate.", "generation": 2},
    "chizuru": {"name": "Chizuru Honsho", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Classmate with a huge crush on Orihime.", "generation": 2},
    "ryo": {"name": "Ryo Kunieda", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Classmate, track team member.", "generation": 2},
    "michiru": {"name": "Michiru Ogawa", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Classmate.", "generation": 2},
    "reiichi": {"name": "Reiichi Oshima", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Classmate.", "generation": 2},
    "mahana": {"name": "Mahana Natsui", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Classmate.", "generation": 2},
    "misato": {"name": "Misato Ochi", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Teacher at Karakura High.", "generation": 1},
    "keisuke": {"name": "Keisuke Sorimachi", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Classmate.", "generation": 2},
    "mizuho": {"name": "Mizuho Asano", "race": "Human", "family": "Asano", "faction": "Human World", "description": "Keigo's older sister.", "generation": 2},
    
    "ikumi": {"name": "Ikumi Unagiya", "race": "Human", "family": "Unagiya", "faction": "Human World", "description": "Owner of Unagiya Shop, Ichigo's boss.", "generation": 1},
    "kaoru": {"name": "Kaoru Unagiya", "race": "Human", "family": "Unagiya", "faction": "Human World", "description": "Ikumi's son.", "generation": 2},
    "don_kanonji": {"name": "Don Kanonji", "race": "Human", "family": "Unknown", "faction": "Human World", "description": "Charismatic TV medium.", "generation": 1},
    "kagine": {"name": "Kagine", "race": "Human", "family": "Unknown", "faction": "Karakura High", "description": "Teacher.", "generation": 1},
    
    "shinji": {"name": "Shinji Hirako", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Captain of Squad 5, Visored leader.", "generation": 1},
    "hiyori": {"name": "Hiyori Sarugaki", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Former Lieutenant of Squad 12, hot-tempered Visored.", "generation": 1},
    "love": {"name": "Love Aikawa", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Former Captain of Squad 7, Visored.", "generation": 1},
    "rose": {"name": "Rojuro Otoribashi", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Captain of Squad 3, Visored.", "generation": 1},
    "kensei": {"name": "Kensei Muguruma", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Captain of Squad 9, Visored.", "generation": 1},
    "mashiro": {"name": "Mashiro Kuna", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Co-Lieutenant of Squad 9, Visored.", "generation": 1},
    "lisa": {"name": "Lisa Yadomaru", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Captain of Squad 8, Visored.", "generation": 1},
    "hachigen": {"name": "Hachigen Ushoda", "race": "Visored", "family": "Unknown", "faction": "Visored", "description": "Former Vice Kido Chief, Visored.", "generation": 1},
    
    "aizen": {"name": "Sosuke Aizen", "race": "Soul Reaper", "family": "Unknown", "faction": "Arrancar", "description": "Former Captain of Squad 5, orchestrator of the Hollowfication incident.", "generation": 1},
    "momo": {"name": "Momo Hinamori", "race": "Soul Reaper", "family": "Unknown", "faction": "Gotei 13", "description": "Lieutenant of Squad 5.", "generation": 2},
    "komamura": {"name": "Sajin Komamura", "race": "Soul Reaper", "family": "Komamura", "faction": "Gotei 13", "description": "Former Captain of Squad 7.", "generation": 1},
    "hisagi": {"name": "Shuhei Hisagi", "race": "Soul Reaper", "family": "Unknown", "faction": "Gotei 13", "description": "Lieutenant of Squad 9.", "generation": 2}
}

chars.update(new_chars)

new_rels = [
    ("ichigo", "orihime", "Marriage", "Married to"),
    ("ichigo", "kazui", "Parent", "Father of"),
    ("orihime", "kazui", "Parent", "Mother of"),
    ("ichigo", "chad", "Friend", "Best friends"),
    ("orihime", "tatsuki", "Friend", "Best friends"),
    ("ichigo", "keigo", "Friend", "Friends"),
    ("ichigo", "mizuiro", "Friend", "Friends"),
    
    ("ryuken", "kanae", "Marriage", "Married to"),
    ("kanae", "uryu", "Parent", "Mother of"),
    ("soken", "izumi", "Marriage", "Married to"),
    ("izumi", "ryuken", "Parent", "Mother of"),
    
    ("urahara", "yoruichi", "Friend", "Childhood friends"),
    ("urahara", "tessai", "Friend", "Comrades in exile"),
    ("urahara", "ichigo", "Mentor", "Mentored"),
    ("urahara", "jinta", "Boss", "Employer"),
    ("urahara", "ururu", "Boss", "Employer"),
    ("urahara", "ririn", "Creator", "Created"),
    ("urahara", "noba", "Creator", "Created"),
    ("urahara", "kurodo", "Creator", "Created"),
    
    ("ginjo", "ichigo", "Mentor", "Taught Fullbring / Betrayed"),
    ("ginjo", "tsukishima", "Friend", "Partners in Xcution"),
    ("tsukishima", "moe", "Mentor", "Followed by"),
    ("ginjo", "riruka", "Boss", "Leader of Xcution"),
    ("ginjo", "yukio", "Boss", "Leader of Xcution"),
    ("ginjo", "jackie", "Boss", "Leader of Xcution"),
    ("ginjo", "giriko", "Boss", "Leader of Xcution"),
    ("chad", "ginjo", "Comrade", "Briefly joined Xcution"),
    
    ("tatsuki", "chizuru", "Friend", "Classmates"),
    ("keigo", "mizuho", "Sibling", "Siblings"),
    ("ikumi", "kaoru", "Parent", "Mother of"),
    ("ikumi", "ichigo", "Boss", "Employer"),
    ("don_kanonji", "ichigo", "Friend", "Spiritual ally"),
    
    ("shinji", "hiyori", "Friend", "Bickering partners"),
    ("love", "rose", "Friend", "Close friends"),
    ("kensei", "mashiro", "Boss", "Captain / Lieutenant"),
    ("kensei", "hisagi", "Mentor", "Saved him / Captain"),
    
    ("shinji", "aizen", "Enemy", "Betrayed by Aizen"),
    ("shinji", "ichigo", "Mentor", "Recruited / Taught Hollowfication"),
    ("hiyori", "ichigo", "Mentor", "Trained him"),
    ("hiyori", "urahara", "Friend", "Former subordinate"),
    ("hachigen", "tessai", "Friend", "Former subordinate"),
    ("shinji", "momo", "Boss", "Former Captain"),
    ("love", "komamura", "Friend", "Fellow Captains"),
]

# Ensure uniqueness
existing_edges = set((r['source'], r['target']) for r in rels)
for s, t, typ, lbl in new_rels:
    if (s, t) not in existing_edges and (t, s) not in existing_edges:
        rels.append({"source": s, "target": t, "type": typ, "label": lbl})

with open(CHAR_FILE, 'w', encoding='utf-8') as f:
    json.dump(chars, f, indent=4, ensure_ascii=False)

with open(REL_FILE, 'w', encoding='utf-8') as f:
    json.dump(rels, f, indent=4, ensure_ascii=False)
print("Updated data files")
