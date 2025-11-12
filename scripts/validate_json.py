import json,traceback,sys
fp = r'r:\\Development\\Projects\\nexefii\\i18n\\en\\wizard.json'
try:
    with open(fp, 'r', encoding='utf-8') as f:
        json.load(f)
    print('OK')
except Exception as e:
    print('ERR', e)
    traceback.print_exc()
    sys.exit(1)
