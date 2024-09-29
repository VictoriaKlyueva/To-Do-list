class Task {
    constructor(Description, IsCompleted=false) {
        this.Id;
        this.Description = Description;
        this.IsCompleted = IsCompleted;
    }
}

// Создание элемента div для дела 
function makeTaskDiv(task) {
    let id = 'task' + task.id.toString();

    // Создание task-div
    var newTaskDiv = document.createElement('div');
    newTaskDiv.className = 'task-div';
    newTaskDiv.id = id;
    document.querySelector('.tasks-divs').appendChild(newTaskDiv);

    // Создание task-info внутри task-div
    var taskInfoDiv = document.createElement('div');
    taskInfoDiv.className = 'task-info';
    taskInfoDiv.id = 'task-info' + id;
    document.getElementById(id).appendChild(taskInfoDiv);

    // Создание кнопки "Удалить" внутри task-div
    var deleteButton = document.createElement('button');
    deleteButton.className = 'delete';
    deleteButton.id = 'delete' + id;
    deleteButton.innerHTML = 'Удалить';
    document.getElementById(id).appendChild(deleteButton);

    // Удаление дела по нажатию на кнопку
    deleteButton.onclick = function() {deleteTask(task.id)}

    // Создание чекбокса внутри task-info
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'taskCheckbox';
    checkbox.id = 'checbox' + id;
    checkbox.checked = task.isCompleted
    document.getElementById('task-info' + id).appendChild(checkbox);

    // Замена состояния flag при нажатии на чекбокс
    checkbox.onclick = () => {changeFlag(task)};

    // Создание имени дела внутри task-info
    var taskDescriptionP = document.createElement('p');
    taskDescriptionP.className = 'taskName';
    taskDescriptionP.id = 'taskName' + id;
    taskDescriptionP.innerHTML = task.description;
    document.getElementById('task-info' + id).appendChild(taskDescriptionP);
}

function changeFlag(task) {
    if (task.isCompleted) {
        fetch('https://localhost:7067/api/todo/incomplete/' + task.id.toString(), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateTasksList();
        })
        .catch((error) => {
            console.error('Ошибка:', error);
        });
    } else {
        fetch('https://localhost:7067/api/todo/complete/' + task.id.toString(), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateTasksList();
        })
        .catch((error) => {
            console.error('Ошибка:', error);
        });
    }
}

// Добавление дела
function addTask() {
    // Получение текста из полейa
    let inputName = document.querySelector('input[name="taskInput"]');
    let taskName = inputName.value;

    // Создание дела с обработкой их количества
    if (tasks.length < 10) {
        let newTask = new Task(taskName);

        fetch('https://localhost:7067/api/todo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateTasksList();
        })
        .catch((error) => {
            console.error('Ошибка:', error);
        });
    } else {
        window.alert('Слишком много дел. Отдохните :)');
    }

    // Очистка текстовых полей
    inputName.value = "";
}

function fetchTasks() {
    return fetch('https://localhost:7067/api/todo', { // добавлен return
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Ошибка при получении задач:', error);
        throw error;
    });
}

// Очистка списка дел
function deleteAllTasksDivs() {
    document.querySelector('.tasks-divs').innerHTML = '';
}

// Создание дивов для задач
function makeDivs() {
    tasks.forEach(item => {
        makeTaskDiv(item);
    });
}

// Обновление всего списка дел
function updateTasksList() {
    // Удаление старых divов задач
    deleteAllTasksDivs()
    
    // Получение списка дел из бд
    fetchTasks()
        .then(receivedTasks => {
            if (receivedTasks) {
                tasks = receivedTasks.sort((a, b) => a.id - b.id);
                makeDivs();
            } else {
                console.log("Не удалось получить задачи");
            }
        })
        .catch(error => {
            console.error('Ошибка при обработке задач:', error);
        });
}

// Удаление элемента из списка
function deleteTask(id) {
    fetch('https://localhost:7067/api/todo/' + id.toString(), {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Дело успешно удалено');
        updateTasksList();
    })
    .catch((error) => {
        console.error('Ошибка:', error);
    });
}

document.getElementById('add').onclick = addTask;

var tasks = [];

// При обновлении страницы
function codeAddress() {
    updateTasksList();
}
window.onload = codeAddress;