import os
import json
import re

class Conductor:
    def __init__(self, project_root):
        self.project_root = project_root
        self.tasks_path = os.path.join(project_root, 'tasks.json')
        self.tracks_dir = os.path.join(project_root, 'guides', 'PAGIA', 'tracks')

    def load_tasks(self):
        if os.path.exists(self.tasks_path):
            with open(self.tasks_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"tasks": []}

    def save_tasks(self, data):
        with open(self.tasks_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    def parse_spec(self, spec_id):
        spec_path = os.path.join(self.tracks_dir, f'track-{spec_id}', 'spec.md')
        if not os.path.exists(spec_path):
            return None
        
        with open(spec_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extrair checklists como tarefas (Simples regex para exemplo)
        tasks = re.findall(r'- \[ \] (.*)', content)
        # Se não houver checklists no spec, tentar no plan
        if not tasks:
            plan_path = os.path.join(self.tracks_dir, f'track-{spec_id}', 'plan.md')
            if os.path.exists(plan_path):
                with open(plan_path, 'r', encoding='utf-8') as pf:
                    tasks = re.findall(r'- \[ \] (.*)', pf.read())
        
        return tasks

    def sync_spec_to_tasks(self, spec_id):
        tasks_found = self.parse_spec(spec_id)
        if not tasks_found:
            return False
        
        current_data = self.load_tasks()
        
        for t_name in tasks_found:
            # Evitar duplicata simples
            if not any(t['name'] == t_name for t in current_data['tasks']):
                current_data['tasks'].append({
                    "id": f"T-{len(current_data['tasks']) + 1:03d}",
                    "name": t_name,
                    "spec": spec_id,
                    "status": "pending",
                    "priority": "medium",
                    "agent": "Architect" if "Setup" in t_name else "Developer"
                })
        
        self.save_tasks(current_data)
        return True

if __name__ == "__main__":
    # Teste rápido do condutor
    c = Conductor(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
    print(f"Sincronizando Spec 002...")
    if c.sync_spec_to_tasks('002'):
        print("✅ Conductor sincronizou Spec 002 com sucesso.")
    else:
        print("❌ Erro ao sincronizar Spec 002.")
