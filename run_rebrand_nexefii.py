# NEXEFII Rebranding Script (run against nexefii folder)
# Automatiza a troca de nome e logo em todos os arquivos dentro de R:\Development\Projects\nexefii

import os
from pathlib import Path

# Configuração
OLD_NAME_VARIANTS = ['iLuxSys', 'IluxSys', 'iluxsys', 'ILUXSYS']
NEW_NAME = 'NEXEFII'
NEW_NAME_LOWER = 'nexefii'

OLD_LOGO = 'logo_iluxsys.png'
NEW_LOGO = 'Nexefii_logo_3d-official.png'

# Diretório base apontando para a cópia
BASE_DIR = Path(r'R:\Development\Projects\nexefii')

# Arquivos a processar (expanda se necessário)
FILES_TO_UPDATE = [
    'index.html',
    'login.html',
    'master-control.html',
    'offline.html',
    'clear-cache.html',
    'test-properties.html',
    'manifest.json',
    'i18n.json',
    'service-worker.js',
    'README_PWA.md',
    'README_PropertyDatabase.md'
]


def replace_in_file(file_path, replacements):
    """Substitui múltiplos padrões em um arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        modified = False
        for old, new in replacements.items():
            if old in content:
                content = content.replace(old, new)
                modified = True

        if modified:
            # create backup
            backup_path = str(file_path) + '.bak.assistant'
            with open(backup_path, 'w', encoding='utf-8') as bf:
                bf.write(open(file_path, 'r', encoding='utf-8').read())

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'✅ Atualizado: {file_path.name}')
            return True
        else:
            print(f'⏭️  Sem mudanças: {file_path.name}')
            return False
    except Exception as e:
        print(f'❌ Erro em {file_path.name}: {e}')
        return False


def main():
    print('🚀 Iniciando rebranding para NEXEFII (nexefii snapshot)...\n')

    # Definir substituições
    replacements = {
        # Nome da marca
        'iLuxSys': NEW_NAME,
        'IluxSys': NEW_NAME,
        'iluxsys': NEW_NAME_LOWER,
        'ILUXSYS': NEW_NAME.upper(),

        # Logo
        OLD_LOGO: NEW_LOGO,
        'logo_iluxsys': 'Nexefii_logo_3d-official',

        # URLs e emails (exemplos)
        'demo@iluxsys.com': f'demo@{NEW_NAME_LOWER}.com',
        'admin@iluxsys.com': f'admin@{NEW_NAME_LOWER}.com',
        'master@iluxsys.com': f'master@{NEW_NAME_LOWER}.com',
        'https://api.iluxsys.com': f'https://api.{NEW_NAME_LOWER}.com',

        # Descrições (exemplos)
        'Hospitality Management Platform': 'Advanced Hospitality Management System',
        'Multi-tenant hospitality management platform': 'Next-generation multi-tenant hospitality platform',
    }

    updated_count = 0

    # Processar arquivos
    for filename in FILES_TO_UPDATE:
        file_path = BASE_DIR / filename
        if file_path.exists():
            if replace_in_file(file_path, replacements):
                updated_count += 1
        else:
            print(f'⚠️  Não encontrado: {filename}')

    print(f'\n✅ Rebranding concluído!')
    print(f'📊 Arquivos atualizados: {updated_count}/{len(FILES_TO_UPDATE)}')


if __name__ == '__main__':
    main()
