class Task:
    def __init__(self, description):
        self.description = description
        self.completed = False

    def complete(self):
        self.completed = True

    def __str__(self):
        status = "[x]" if self.completed else "[ ]"
        return f"{status} {self.description}"

class TodoList:
    def __init__(self):
        self.tasks = []

    def add_task(self, description):
        task = Task(description)
        self.tasks.append(task)
        print(f"Tarefa adicionada: {description}")

    def list_tasks(self):
        if not self.tasks:
            print("Nenhuma tarefa na lista.")
            return
        print("Lista de Tarefas:")
        for index, task in enumerate(self.tasks):
            print(f"{index + 1}. {task}")

    def complete_task(self, index):
        if 0 <= index < len(self.tasks):
            self.tasks[index].complete()
            print(f"Tarefa {index + 1} marcada como concluída.")
        else:
            print("Índice de tarefa inválido.")

# Exemplo de uso
if __name__ == "__main__":
    todo = TodoList()
    todo.add_task("Configurar PAGIA CLI")
    todo.add_task("Testar Groq API")
    todo.list_tasks()
    todo.complete_task(0)
    todo.list_tasks()
