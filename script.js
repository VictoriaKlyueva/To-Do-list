const apiUrl = "http://localhost:5055/api/todo";
let currentEditingTask = null;

const modal = document.getElementById('edit-modal');
const taskInput = document.querySelector('.task-form__input');
const tasksContainer = document.getElementById('tasks-container');
const addButton = document.getElementById('add');
const saveButton = document.getElementById('save-changes');
const closeButton = document.querySelector('.modal__close');

document.addEventListener('DOMContentLoaded', () => {
  addButton.addEventListener('click', addTask);
  closeButton.addEventListener('click', closeModal);
  saveButton.addEventListener('click', saveTaskChanges);
  
  // Закрытие модального окна при клике не на него
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
  
  updateTasksList();
});


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
    const taskElement = document.createElement('div');
    
    let statusClass = '';
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;
    
    if (task.status === 'Completed' || task.status === 'Late') {
      statusClass = 'task-status--completed';
    } else if (deadline) {
      const timeDiff = deadline - now;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (timeDiff <= 0) {
        statusClass = 'task-status--overdue';
      } else if (daysDiff < 3) {
        statusClass = 'task-status--warning';
      }
    }
  
    taskElement.className = `task-card task-card--${task.priority.toLowerCase()} ${statusClass}`;
    taskElement.dataset.id = task.id;
  
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.status === 'Completed' || task.status === 'Late';
    checkbox.addEventListener('change', () => toggleTaskCompletion(task));
  
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
  
    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.description || '';
  
    const meta = document.createElement('div');
    meta.className = 'task-meta';
  
    const deadlineElement = document.createElement('div');
    deadlineElement.className = 'task-deadline';
    
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const timeLeft = getTimeLeftString(deadlineDate);
      deadlineElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${deadlineDate.toLocaleString()} (${timeLeft})`;
    } else {
      deadlineElement.innerHTML = '<i class="far fa-calendar-alt"></i> Без дедлайна';
    }
  
    const priority = document.createElement('div');
    priority.className = 'task-priority';
    priority.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${getPriorityName(task.priority)}`;
  
    const status = document.createElement('div');
    status.className = `task-status task-status--${task.status.toLowerCase()}`;
    status.innerHTML = `<i class="fas fa-info-circle"></i> ${getStatusName(task.status)}`;
  
    const actions = document.createElement('div');
    actions.className = 'task-actions';
  
    const editButton = document.createElement('button');
    editButton.className = 'task-button task-button--edit';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Редактировать';
    editButton.addEventListener('click', () => openEditModal(task));
  
    const deleteButton = document.createElement('button');
    deleteButton.className = 'task-button task-button--delete';
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Удалить';
    deleteButton.addEventListener('click', () => deleteTask(task.id));
  
    meta.append(deadlineElement, priority, status);
    actions.append(editButton, deleteButton);
    
    const header = document.createElement('div');
    header.className = 'task-header';
    header.append(checkbox, title);
  
    taskElement.append(header, description, meta, actions);
  
    return taskElement;
  }
  
  function getTimeLeftString(deadline) {
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) return 'Просрочено';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `Осталось: ${days} д. ${hours} ч.`;
    } else {
      return `Осталось: ${hours} ч.`;
    }
  }

// Открытие модалки редактирования
function openEditModal(task) {
  currentEditingTask = task;
  
  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-description').value = task.description || '';
  document.getElementById('edit-deadline').value = task.deadline 
    ? new Date(task.deadline).toISOString().slice(0, 16) 
    : '';
  document.getElementById('edit-priority').value = task.priority;
  
  modal.style.display = 'flex';
}

// Закрытие модалки
function closeModal() {
  modal.style.display = 'none';
  currentEditingTask = null;
}

// Сохранение изменений задачи
function saveTaskChanges() {
  if (!currentEditingTask) return;
  
  const updatedTask = {
    title: document.getElementById('edit-title').value,
    description: document.getElementById('edit-description').value,
    deadline: document.getElementById('edit-deadline').value 
      ? new Date(document.getElementById('edit-deadline').value)
      : null,
    priority: document.getElementById('edit-priority').value
  };
  
  updateTask(currentEditingTask.id, updatedTask);
  closeModal();
}

// Добавление новой задачи
async function addTask() {
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const deadlineInput = document.getElementById('task-deadline');
    const priorityInput = document.getElementById('task-priority');
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const deadline = deadlineInput.value ? new Date(deadlineInput.value) : null;
    const priority = priorityInput.value;
    
    if (!title || title.length < 4) {
      showAlert('Название задачи обязательно и должно содержать минимум 4 символа', 'error');
      titleInput.focus();
      return;
    }
  
    try {
      const newTask = {
        title,
        description: description || null,
        deadline,
        priority
      };
      
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
      descriptionInput.value = '';
      deadlineInput.value = '';
      priorityInput.value = 'Medium';
      
      showAlert('Задача успешно добавлена', 'success');
    } catch (error) {
      console.error('Ошибка:', error);
      showAlert('Не удалось создать задачу', 'error');
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
    showAlert('Задача успешно обновлена', 'success');
  } catch (error) {
    console.error('Ошибка:', error);
    showAlert('Не удалось обновить задачу', 'error');
  }
}

// Переключение статуса
async function toggleTaskCompletion(task) {
  try {
    const response = await fetch(`${apiUrl}/toggle-completion/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) throw new Error('Ошибка при изменении статуса');
    
    await updateTasksList();
  } catch (error) {
    console.error('Ошибка:', error);
    showAlert('Не удалось изменить статус задачи', 'error');
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
    showAlert('Задача успешно удалена', 'success');
  } catch (error) {
    console.error('Ошибка:', error);
    showAlert('Не удалось удалить задачу', 'error');
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
    showAlert('Не удалось загрузить задачи', 'error');
    return [];
  }
}

// Обновление списка задач на странице
async function updateTasksList() {
  try {
    tasksContainer.innerHTML = '';
    const tasks = await fetchTasks();
    
    if (tasks.length === 0) {
      tasksContainer.innerHTML = '<p class="no-tasks">Нет задач для отображения</p>';
      return;
    }
    
    tasks.forEach(task => {
      tasksContainer.appendChild(createTaskElement(task));
    });
  } catch (error) {
    console.error('Ошибка при обновлении списка:', error);
  }
}

function getPriorityName(priority) {
  const names = {
    'Low': 'Низкий',
    'Medium': 'Средний',
    'High': 'Высокий',
    'Critical': 'Критический'
  };
  return names[priority] || priority;
}

function getStatusName(status) {
  const names = {
    'Active': 'Активная',
    'Completed': 'Выполнена',
    'Overdue': 'Просрочена',
    'Late': 'Завершена с опозданием'
  };
  return names[status] || status;
}

function showAlert(message, type) {
  const alert = document.createElement('div');
  alert.className = `alert alert--${type}`;
  alert.textContent = message;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.classList.add('alert--fade');
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}