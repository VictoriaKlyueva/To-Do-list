const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5500';
const API_URL = 'http://localhost:5055/api/todo';

test.beforeEach(async ({ page, request }) => {
    await page.goto(BASE_URL);
    await request.delete(`${API_URL}/clear-all`);
});

// --- Вспомогательные функции ---
async function fillTaskForm(page, data) {
    if (data.title) await page.fill('#task-title', data.title);
    if (data.description) await page.fill('#task-description', data.description);
    if (data.deadline) await page.fill('#task-deadline', data.deadline);
    if (data.priority) await page.selectOption('#task-priority', data.priority);
}

async function fillEditForm(page, data) {
    if (data.title) await page.fill('#edit-title', data.title);
    if (data.description) await page.fill('#edit-description', data.description);
    if (data.deadline !== undefined) {
        await page.fill('#edit-deadline', data.deadline);
    }
    if (data.priority) await page.selectOption('#edit-priority', data.priority);
}

async function verifyTaskCard(page, expected) {
    if (expected.title) await expect(page.locator('.task-title')).toHaveText(expected.title);
    if (expected.description) await expect(page.locator('.task-description')).toHaveText(expected.description);
    if (expected.priority) await expect(page.locator('.task-priority')).toContainText(expected.priority);
    if (expected.deadlineText) {
        await expect(page.locator('.task-deadline')).toContainText(expected.deadlineText);
    }
    if (expected.statusClass) {
        await expect(page.locator('.task-card')).toHaveClass(new RegExp(expected.statusClass));
    }
}

async function createTestTask(page, title, deadline = '2026-01-01T00:00') {
    await page.fill('#task-title', title);
    if (deadline) {
        await page.fill('#task-deadline', deadline);
    }
    await page.click('#add');
    await expect(page.locator('.task-title')).toHaveText(title);
}

async function createTestTasks(page, count) {
    for (let i = 1; i <= count; i++) {
        await fillTaskForm(page, {
            title: `Задача ${i}`,
            priority: i % 2 === 0 ? 'Низкий приоритет' : 'Средний приоритет',
            deadline: `2025-0${i}-01T00:00`
        });
        await page.click('#add');
    }
}

// --- 1. Тесты добавления задач ---
const taskTestCases = {
    valid: [
        {
            title: 'Минимальные данные',
            input: { title: 'Тест', description: '', deadline: '', priority: 'Не выбрано' },
            expected: { priority: 'Средний', deadlineText: 'Без дедлайна' }
        },
        {
            title: 'Максимальные данные',
            input: { 
                title: 'Очень длинное название', 
                description: 'Подробное описание'.repeat(10),
                deadline: '2025-12-31T23:59',
                priority: 'Критический приоритет'
            },
            expected: { 
                priority: 'Критический',
                deadlineText: /Дедлайн: 12\/31\/2025/
            }
        },
        {
            title: 'Дата в прошлом',
            input: { title: 'Просрочка', deadline: '2020-01-01T00:00' },
            expected: { statusClass: 'task-card--overdue' }
        }
    ],
    invalid: [
        { title: '', error: '#task-title:invalid' },
        { title: '   ', error: '#task-title:invalid' },
        { title: '123', error: '#task-title:invalid' }
    ],
    priority: [
        { title: '!1 Критичная', priority: 'Не выбрано', expectedPriority: 'Критический', expectedTitle: 'Критичная' },
        { title: 'Обычная !2', priority: 'Низкий приоритет', expectedPriority: 'Низкий', expectedTitle: 'Обычная' },
        { title: 'Некорректный макрос !5', priority: 'Не выбрано', expectedPriority: 'Средний' }
    ]
};

test.describe('Добавление задач', () => {
    // Валидные случаи
    test.describe('Валидные данные', () => {
        for (const testCase of taskTestCases.valid) {
            test(testCase.title, async ({ page }) => {
                await fillTaskForm(page, testCase.input);
                await page.click('#add');
                
                await verifyTaskCard(page, {
                    title: testCase.input.title,
                    description: testCase.input.description || '',
                    ...testCase.expected
                });
            });
        }
    });

    // Невалидные случаи
    test.describe('Невалидные данные', () => {
        for (const testCase of taskTestCases.invalid) {
            test(`Некорректное название: "${testCase.title}"`, async ({ page }) => {
                await page.fill('#task-title', testCase.title);
                await page.click('#add');
                await expect(page.locator(testCase.error)).toBeVisible();
            });
        }
    });

    // Приоритеты
    test.describe('Автоматическое определение приоритета', () => {
        for (const testCase of taskTestCases.priority) {
            test(testCase.title, async ({ page }) => {
                await page.fill('#task-title', testCase.title);
                await page.selectOption('#task-priority', testCase.priority);
                await page.click('#add');
                
                await expect(page.locator('.task-title'))
                    .toHaveText(testCase.expectedTitle || testCase.title);
                await expect(page.locator('.task-priority'))
                    .toContainText(testCase.expectedPriority);
            });
        }
    });
});

// --- 2. Тесты редактирования ---
const editTestCases = [
    {
        name: 'Редактирование всех полей',
        changes: {
            title: 'Новое название',
            description: 'Новое описание',
            deadline: '2026-01-01T00:00',
            priority: 'Высокий'
        }
    },
    {
        name: 'Удаление дедлайна',
        changes: { deadline: '' }
    },
    {
        name: 'Минимальное редактирование',
        changes: { title: '1 символ' }
    }
];

test.describe('Редактирование задач', () => {
    for (const testCase of editTestCases) {
        test(testCase.name, async ({ page }) => {
            await fillTaskForm(page, {
                title: 'Исходная задача',
                description: 'Исходное описание',
                deadline: '2025-01-01T00:00',
                priority: 'Средний приоритет'
            });
            await page.click('#add');
            
            await page.click('.task-button--edit');
            await fillEditForm(page, testCase.changes);
            await page.click('#save-changes');
            
            await verifyTaskCard(page, testCase.changes);
        });
    }
});

// --- 3. Тесты удаления ---
test('Удаление задачи', async ({ page }) => {
    await createTestTasks(page, 3);
    const initialCount = await page.locator('.task-card').count();
    await page.locator('.task-button--delete').first().click();
    await expect(page.locator('.task-card')).toHaveCount(initialCount - 1);
});

// --- 4. Тесты фильтрации ---
const filterTestCases = [
    { 
        name: 'Фильтр: Активные',
        filterValue: 'Active',
        setup: async (page) => {
            await createTestTask(page, 'Активная задача');
        },
        verify: async (page) => {
            await expect(page.locator('.task-status')).toHaveText('Активная');
        }
    },
    { 
        name: 'Фильтр: Выполненные',
        filterValue: 'Completed', 
        setup: async (page) => {
            await createTestTask(page, 'Выполненная задача');
            await page.locator('.task-checkbox').click();
            await expect(page.locator('.task-status')).toHaveText('Выполнена');
        },
        verify: async (page) => {
            await expect(page.locator('.task-status')).toHaveText('Выполнена');
        }
    },
    { 
        name: 'Фильтр: Просроченные',
        filterValue: 'Overdue',
        setup: async (page) => {
            // Создаем просроченную задачу
            await createTestTask(page, 'Просроченная задача', '2020-01-01T00:00');
            await expect(page.locator('.task-status')).toHaveText('Просрочена');
        },
        verify: async (page) => {
            await expect(page.locator('.task-status')).toHaveText('Просрочена');
        }
    }
];

test.describe('Фильтрация задач', () => {
    for (const testCase of filterTestCases) {
        test(testCase.name, async ({ page }) => {
            await testCase.setup(page);

            await page.selectOption('#status-filter', testCase.filterValue);
            await page.waitForTimeout(1000); 

            await testCase.verify(page);
            await expect(page.locator('.task-card')).toHaveCount(1);
        });
    }
});

// --- 5. Тесты сортировки ---
const sortTestCases = [
    { sortBy: 'Дедлайну', descending: true, expectedOrder: ['2025-12-30', '2024-12-31'] },
    { sortBy: 'Приоритету', descending: false, expectedOrder: ['Низкий', 'Средний'] },
    { sortBy: 'Названию', descending: true, expectedOrder: ['B задача', 'A задача'] }
];

test.describe('Сортировка задач', () => {
    for (const testCase of sortTestCases) {
        test(`Сортировка по ${testCase.sortBy} (${testCase.descending ? 'убыванию' : 'возрастанию'})`, 
        async ({ page }) => {
            await fillTaskForm(page, {
                title: 'A задача',
                priority: 'Средний приоритет',
                deadline: '2025-01-01T00:00'
            });
            await page.click('#add');
            
            await fillTaskForm(page, {
                title: 'B задача',
                priority: 'Низкий приоритет',
                deadline: '2025-12-31T00:00'
            });
            await page.click('#add');
            
            // Применяем сортировку
            await page.selectOption('#sort-by', testCase.sortBy);
            if (testCase.descending) {
                await page.check('#sort-descending');
            } else {
                await page.uncheck('#sort-descending');
            }
            
            // Проверяем порядок
            const elements = await page.locator(
                testCase.sortBy === 'Приоритету' ? '.task-priority' : 
                testCase.sortBy === 'Названию' ? '.task-title' : '.task-deadline'
            ).all();
            
            for (let i = 0; i < testCase.expectedOrder.length; i++) {
                let text = await elements[i].textContent();

                if (testCase.sortBy === 'Дедлайну') {
                    // Преобразование строкии дедлайна к нужному формату
                    text = text.match(/\b(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/([0-9]{4})\b/g)[0]
                    const [month, day, year] = text.split('/');
                    text = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }

                expect(text).toContain(testCase.expectedOrder[i]);
            }
        });
    }
});