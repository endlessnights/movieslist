const API_URL = "https://hook.eu1.make.com/ncxl6bbzu2xylfye6y6rwhlmmp13wwvw";

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

        // На всякий случай отбрасываем старые пустые записи.
        items = items.filter(item => item.title);

        loadingElement.hidden = true;

        updateCounters();
        render();

    } catch (error) {
        console.error(error);

        loadingElement.hidden = true;
        errorElement.hidden = false;
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
            (statusFilter === "watched" && item.Watched === true) ||
            (statusFilter === "unwatched" && item.Watched !== true);

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
            `item ${item.Watched ? "watched" : ""}`;

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = item.Watched === true;

        // Пока read-only.
        checkbox.disabled = true;

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
        items.filter(item => item.Watched !== true).length;
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