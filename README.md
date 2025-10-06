
# Vektor3D: магазин 3D‑моделей (стартовый шаблон)

Готовая одностраничная витрина на HTML/CSS/JS без бэкенда.
- Каталог с поиском и фильтрами (категории, форматы, цена, полигоны).
- Корзина (localStorage) и офорление через e‑mail. На карточке — кнопка «Купить сейчас» через Payment Link.
- Простая тёмная/светлая тема, адаптивный дизайн.
- Структурированные данные (JSON‑LD) для SEO (тип Product/Offer).

## Быстрый старт (локально)

1. Распакуйте архив.
2. Запустите статический сервер из папки проекта (иначе fetch('products.json') может блокироваться браузером):
   - Python: `python3 -m http.server 5500`
   - Node: `npx serve`
3. Откройте `http://localhost:5500` (или адрес, который показал сервер).

> Если вы просто откроете `index.html` двойным кликом, сайт всё равно запустится благодаря встроенному inline‑fallback (данные продуктов в теге `<script type="application/json">`).

## Кастомизация

- **Название/валюта/e‑mail** — измените `config.js`:
  ```js
  window.__SHOP_CONFIG__ = {
    siteName: "Vektor3D",
    tagline: "Готовые 3D‑модели для игр, визуализации и VR",
    currency: "USD", // например, EUR, USD, RUB
    locale: "ru-RU",     // например, ru-RU
    salesEmail: "sales@yourdomain.tld",
    theme: { enableDarkMode: true }
  }
  ```

- **Товары** — редактируйте `products.json` (и замените изображения в `assets/` своими превью):
  ```json
  {
  "id": "sci-fi-crate",
  "name": "Sci‑Fi Crate",
  "category": "Props",
  "price": 9.0,
  "formats": [
    "FBX",
    "OBJ",
    "GLTF"
  ],
  "polycount": 2400,
  "rigged": false,
  "animated": false,
  "textures": "PBR 4K (BaseColor, Roughness, Metalness, Normal, AO)",
  "tags": [
    "sci‑fi",
    "crate",
    "pbr",
    "game‑ready",
    "low‑poly"
  ],
  "license": "Standard Commercial",
  "cover": "assets/sci-fi-crate.svg",
  "paymentLink": "",
  "description": "Научно‑фантастический ящик с PBR‑текстурами. Оптимизирован для игр и рендеринга."
}
  ```
  Поля:
  - `id` — уникальный идентификатор (используется в корзине);
  - `name`, `category`, `description`, `tags`;
  - `price` — цена в валюте из `config.js`;
  - `formats` — массив строк (например, `["FBX","OBJ","GLTF"]`);
  - `polycount` — число треугольников (tris);
  - `rigged`, `animated` — флаги;
  - `cover` — путь к миниатюре;
  - `paymentLink` — *необязательно*: ссылка на мгновенную оплату (Stripe Payment Link, Gumroad/Boosty и т.п.).

- **Оплата**
  - Вариант А (простой): в корзине нажмите «Оформить заказ» — откроется окно e‑mail с позицией заказа. Укажите свою почту в `config.js -> salesEmail`.
  - Вариант Б (ссылки оплаты): создайте Payment Link на вашей платформе и вставьте URL в поле `paymentLink` у нужного товара — активируется «Купить сейчас».

## Деплой

- **GitHub Pages**: залейте репозиторий → `Settings → Pages → Deploy from branch`.
- **Netlify / Vercel**: перетащите папку в панель проекта — всё готово.
- **Собственный домен**: привяжите DNS к выбранному хостингу.

## Идеи для развития

- Детальные страницы товаров и 3D‑превью (например, через `<model-viewer>` или three.js).
- Аккаунты пользователей + автоматическая выдача ссылок на скачивание после оплаты.
- Многоязычность (i18n), отзывы и рейтинг, промокоды.
- Интеграция с CMS (Contentful, Strapi) или Google Sheets для товара.
