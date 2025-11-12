fp = r'r:\\Development\\Projects\\nexefii\\i18n\\en\\wizard.json'
with open(fp, 'rb') as f:
    data = f.read()

print('Total bytes:', len(data))
start = max(0, len(data)-200)
print('\n=== last 200 bytes (raw) ===')
print(repr(data[start:]))
print('\n=== last 200 bytes (decoded) ===')
print(data[start:].decode('utf-8', errors='replace'))

print('\n=== last 40 lines with numbers ===')
with open(fp, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()
for i, line in enumerate(lines[-40:], start=max(1, len(lines)-39)):
    print(f"{i:04}: {line.rstrip()}")
