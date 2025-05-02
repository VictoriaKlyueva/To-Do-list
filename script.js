let apiUrl = "http://localhost:5055/api/todo";

class Task {
    constructor(title, description = "", deadline = null, priority = "Medium") {
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.priority = priority;
    }
}

// Создание элемента задачи
function createTaskElement(task) {
    let taskDiv = document.createElement('div');
    taskDiv.className = 'task-div';
    taskDiv.id = `task-${task.id}`;
    taskDiv.dataset.priority = task.priority.toLowerCase();

    // Чекбокс выполнения
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.status === 'Completed' || task.status === 'Late';
    checkbox.onclick = () => toggleTaskCompletion(task);

    // Основная информация о задаче
    let taskInfo = document.createElement('div');
    taskInfo.className = 'task-info';

    let titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'task-title';
    titleInput.value = task.title;
    
    let descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.className = 'task-description';
    descriptionInput.value = task.description || '';
    
    let deadlineInput = document.createElement('input');
    deadlineInput.type = 'datetime-local';
    deadlineInput.className = 'task-deadline';
    if (task.deadline) {
        deadlineInput.value = new Date(task.deadline).toISOString().slice(0, 16);
    }

    // Приоритет
    let prioritySelect = document.createElement('select');
    prioritySelect.className = 'task-priority';
    ['Low', 'Medium', 'High', 'Critical'].forEach(priority => {
        let option = document.createElement('option');
        option.value = priority;
        option.textContent = priority;
        option.selected = task.priority === priority;
        prioritySelect.appendChild(option);
    });

    // Кнопки управления
    let updateBtn = document.createElement('button');
    updateBtn.className = 'update-btn';
    updateBtn.textContent = 'Обновить';
    updateBtn.onclick = () => updateTask(task.id, {
        title: titleInput.value,
        description: descriptionInput.value,
        deadline: deadlineInput.value ? new Date(deadlineInput.value) : null,
        priority: prioritySelect.value
    });

    let deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Удалить';
    deleteBtn.onclick = () => deleteTask(task.id);

    // Сборка элемента
    taskInfo.append(
        checkbox,
        titleInput,
        descriptionInput,
        deadlineInput,
        prioritySelect
    );
    
    taskDiv.append(
        taskInfo,
        updateBtn,
        deleteBtn
    );

    return taskDiv;
}

// Добавление новой задачи
async function addTask() {
    const titleInput = document.querySelector('input[name="taskInput"]');
    const title = titleInput.value.trim();
    
    if (!title || title.length < 4) {
        alert('Название задачи обязательно и должно содержать минимум 4 символа');
        return;
    }

    try {
        const newTask = new Task(title);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask)
        });

        if (!response.ok) throw new Error('Ошибка при создании задачи');
        
        await updateTasksList();
        titleInput.value = '';
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось создать задачу');
    }
}

// Обновление задачи
async function updateTask(id, updatedData) {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error('Ошибка при обновлении задачи');
        
        await updateTasksList();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось обновить задачу');
    }
}

// Переключение статуса выполнения
async function toggleTaskCompletion(task) {
    try {
        const endpoint = task.status === 'Completed' || task.status === 'Late' 
            ? 'incomplete' 
            : 'complete';
        
        const response = await fetch(`${apiUrl}/${endpoint}/${task.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) throw new Error('Ошибка при изменении статуса');
        
        await updateTasksList();
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Удаление задачи
async function deleteTask(id) {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) throw new Error('Ошибка при удалении задачи');
        
        await updateTasksList();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить задачу');
    }
}

// Получение списка задач
async function fetchTasks() {
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) throw new Error('Ошибка при получении задач');
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return [];
    }
}

// Обновление списка задач на странице
async function updateTasksList() {
    try {
        const tasksContainer = document.querySelector('.tasks-divs');
        tasksContainer.innerHTML = '';

        const tasks = await fetchTasks();
        tasks.forEach(task => {
            tasksContainer.appendChild(createTaskElement(task));
        });
    } catch (error) {
        console.error('Ошибка при обновлении списка:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add').addEventListener('click', addTask);
    updateTasksList();
});