const API_URL = "/api/movies";

let items = [];

let statusFilter = "all";
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

        // На всякий случай игнорируем некорректные записи.
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

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = item.watched === true;

        checkbox.addEventListener("change", () => {
            setWatched(item, checkbox.checked, checkbox);
        });

        const info = document.createElement("div");
        info.className = "item-info";

        const title = document.createElement("p");
        title.className = "item-title";
        title.textContent = item.title;

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
        element.append(checkbox, info);

        listElement.append(element);
    }
}


function updateCounters() {
    totalCountElement.textContent = items.length;

    remainingCountElement.textContent =
        items.filter(item => item.watched !== true).length;
}


document
    .querySelector("#search")
    .addEventListener("input", event => {

        searchQuery = event.target.value;

        render();
    });


document
    .querySelector("#statusFilters")
    .addEventListener("click", event => {

        const button = event.target.closest("button");

        if (!button) return;

        statusFilter = button.dataset.status;

        document
            .querySelectorAll("#statusFilters button")
            .forEach(item =>
                item.classList.toggle("active", item === button)
            );

        render();
    });


document
    .querySelector("#typeFilters")
    .addEventListener("click", event => {

        const button = event.target.closest("button");

        if (!button) return;

        typeFilter = button.dataset.type;

        document
            .querySelectorAll("#typeFilters button")
            .forEach(item =>
                item.classList.toggle("active", item === button)
            );

        render();
    });


loadWatchlist();