with open('c:/Users/incharas/Downloads/W3/backend/logs/app.log', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()
with open('c:/Users/incharas/Downloads/W3/backend/logs/app_tail.log', 'w', encoding='utf-8') as f:
    f.writelines(lines[-200:])
