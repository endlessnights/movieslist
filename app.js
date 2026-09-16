const API_URL = "/api/movies";

let items = [];

// По умолчанию показываем только непросмотренные.
let statusFilter = "unwatched";
let typeFilter = "all";
let searchQuery = "";

const listElement = document.querySelector("#list");
const loadingElement = document.querySelector("#loading");
const errorElement = document.querySelector("#error");
const emptyElement = document.querySelector("#empty");

const totalCountElement = document.querySelector("#totalCount");
const remainingCountElement = document.querySelector("#remainingCount");


async function loadWatchlist() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        items = await response.json();

        // Игнорируем некорректные записи без названия.
        items = items.filter(item => item.title);

        loadingElement.hidden = true;
        errorElement.hidden = true;

        updateCounters();
        render();

    } catch (error) {
        console.error(error);

        loadingElement.hidden = true;
        errorElement.hidden = false;
    }
}


async function setWatched(item, watched, checkbox) {
    // Пока запрос выполняется, запрещаем повторные клики.
    checkbox.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: item.id,
                watched: watched
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        // Обновляем локальные данные без повторного GET.
        item.watched = result.watched;
        item.watchedAt = result.watchedAt;

        updateCounters();
        render();

    } catch (error) {
        console.error("Failed to update watched status:", error);

        // Возвращаем чекбокс обратно, если PATCH не прошёл.
        checkbox.checked = item.watched;

        alert("Не удалось изменить статус просмотра.");

    } finally {
        checkbox.disabled = false;
    }
}


// Форматируем дату:
// 17 сентября 2026, 00:20
function formatDate(dateString) {
    if (!dateString) return "";

    let normalizedDate = dateString;

    /*
     * watchedAt приходит в ISO:
     * 2026-09-16T22:20:00.218Z
     *
     * createdAt из D1 приходит:
     * 2026-09-16 22:16:59
     *
     * D1 CURRENT_TIMESTAMP хранит UTC,
     * поэтому превращаем createdAt в корректный ISO UTC.
     */
    if (
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)
    ) {
        normalizedDate = dateString.replace(" ", "T") + "Z";
    }

    const date = new Date(normalizedDate);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const months = [
        "января",
        "февраля",
        "марта",
        "апреля",
        "мая",
        "июня",
        "июля",
        "августа",
        "сентября",
        "октября",
        "ноября",
        "декабря"
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    const hours =
        String(date.getHours()).padStart(2, "0");

    const minutes =
        String(date.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}


function render() {
    const filteredItems = items.filter(item => {

        const matchesSearch =
            item.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "watched" && item.watched === true) ||
            (statusFilter === "unwatched" && item.watched !== true);

        const matchesType =
            typeFilter === "all" ||
            item.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    listElement.innerHTML = "";

    emptyElement.hidden = filteredItems.length !== 0;

    for (const item of filteredItems) {

        const element = document.createElement("article");

        element.className =
            `item ${item.watched ? "watched" : ""}`;


        // Checkbox

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = item.watched === true;

        checkbox.addEventListener("change", () => {
            setWatched(
                item,
                checkbox.checked,
                checkbox
            );
        });


        // Основная информация

        const info = document.createElement("div");
        info.className = "item-info";


        // Название

        const title = document.createElement("p");

        title.className = "item-title";
        title.textContent = item.title;


        // Год и тип

        const meta = document.createElement("div");

        meta.className = "item-meta";

        const type =
            item.type === "movie"
                ? "Фильм"
                : item.type === "series"
                    ? "Сериал"
                    : "Тип неизвестен";

        meta.textContent =
            [item.year, type]
                .filter(Boolean)
                .join(" • ");


        info.append(title, meta);


        // Дата

        const dateInfo = document.createElement("div");
        dateInfo.className = "item-date";

        if (item.watched && item.watchedAt) {

            dateInfo.textContent =
                `Просмотрено: ${formatDate(item.watchedAt)}`;

        } else if (item.createdAt) {

            dateInfo.textContent =
                `Добавлено: ${formatDate(item.createdAt)}`;
        }

        if (dateInfo.textContent) {
            info.append(dateInfo);
        }


        element.append(
            checkbox,
            info
        );

        listElement.append(element);
    }
}


function updateCounters() {
    totalCountElement.textContent =
        items.length;

    remainingCountElement.textContent =
        items.filter(
            item => item.watched !== true
        ).length;
}


// Поиск

document
    .querySelector("#search")
    .addEventListener("input", event => {

        searchQuery = event.target.value;

        render();
    });


// Фильтр по статусу

document
    .querySelector("#statusFilters")
    .addEventListener("click", event => {

        const button =
            event.target.closest("button");

        if (!button) return;

        statusFilter =
            button.dataset.status;

        document
            .querySelectorAll("#statusFilters button")
            .forEach(item =>
                item.classList.toggle(
                    "active",
                    item === button
                )
            );

        render();
    });


// Фильтр по типу

document
    .querySelector("#typeFilters")
    .addEventListener("click", event => {

        const button =
            event.target.closest("button");

        if (!button) return;

        typeFilter =
            button.dataset.type;

        document
            .querySelectorAll("#typeFilters button")
            .forEach(item =>
                item.classList.toggle(
                    "active",
                    item === button
                )
            );

        render();
    });


loadWatchlist();