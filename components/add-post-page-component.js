import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";
import { goToPage, user } from "../index.js";
import { POSTS_PAGE } from "../routes.js";

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
  let imageUrl = "";
  let isLoading = false;

  const render = () => {
    const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <div class="form">
        <h3 class="form-title">Добавить пост</h3>
        <div class="form-inputs">
          <div class="upload-image-container"></div>
          <textarea 
            id="description-textarea"
            class="input-textarea"
            placeholder="Описание поста..."
            rows="4">
          </textarea>
          <div class="form-error"></div>
          <button class="button" id="add-button" ${isLoading ? "disabled" : ""}>
            ${isLoading ? "Публикация..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
    `;

    appEl.innerHTML = appHtml;

    // Передаём user в header component
    renderHeaderComponent({
      element: document.querySelector(".header-container"),
      user,
    });

    renderUploadImageComponent({
      element: document.querySelector(".upload-image-container"),
      onImageUrlChange(newImageUrl) {
        imageUrl = newImageUrl;
      },
    });

    document.getElementById("add-button").addEventListener("click", () => {
      const description = document
        .getElementById("description-textarea")
        .value.trim();
      const errorEl = document.querySelector(".form-error");

      if (!imageUrl) {
        errorEl.textContent = "Добавьте фотографию";
        return;
      }
      if (!description) {
        errorEl.textContent = "Добавьте описание";
        return;
      }
      if (description.length > 200) {
        errorEl.textContent = "Описание должно быть не более 200 символов";
        return;
      }

      errorEl.textContent = "";
      isLoading = true;
      render();

      onAddPostClick({ description, imageUrl })
        .then(() => {
          goToPage(POSTS_PAGE);
        })
        .catch((error) => {
          console.error("Ошибка добавления поста:", error);
          errorEl.textContent = "Не удалось опубликовать пост";
        })
        .finally(() => {
          isLoading = false;
          render();
        });
    });
  };

  render();
}

// import { renderHeaderComponent } from "./header-component.js";
// import { renderUploadImageComponent } from "./upload-image-component.js";
// import { goToPage, POSTS_PAGE } from "../index.js";
// import { POSTS_PAGE } from "../routes.js";

// export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
//   let imageUrl = "";
//   let isLoading = false;

//   const render = () => {
//     // @TODO: Реализовать страницу добавления поста
//     const appHtml = `
//     <div class="page-container">
//       <div class="header-container"></div>
//       <div class="form">
//       <h3 class="form-title">Добавить пост</h3>
//       <div class="form-inputs">
//       <div class="upload-image-container"></div>
//       <textarea
//       id="description-textarea"
//       class="input-textarea"
//       placeholder="Описание поста..."
//       rows="4">
//       </textarea>
//       <div class="form-error"></div>
//       <button class="button" id="add-button" ${isLoading ? "disabled" : ""}>${isLoading ? "Публикация..." : "Добавить"}</button>
//     </div>
//     </div>
//     </div>
//   `;

//     appEl.innerHTML = appHtml;

//     renderHeaderComponent({
//       element: document.querySelector(".header-container"),
//     });

//     renderUploadImageComponent({
//       element: document.querySelector(".upload-image-container"),
//       onImageUrlChange(newImageUrl) {
//         imageUrl = newImageUrl;
//       },
//     });

//     document.getElementById("add-button").addEventListener("click", () => {
//       const descriptionElement = document.getElementById("description-textarea");
//       const description = descriptionElement.value.trim();
//       const errorEl = document.querySelector(".form-error");

//       if (!imageUrl) {
//         errorEl.textContent = "Добавьте фотографию";
//         return;
//       }
//       if (!description) {
//         errorEl.textContent = "Добавьте описание";
//         return;
//       }
//       if (description.length > 200) {
//         errorEl.textContent = "Описание должно быть не более 200 смоволов";
//         return;
//       }

//       errorEl.textContent = "";
//       isLoading = true;
//       render()

//       onAddPostClick({ description, imageUrl })
//       .then (() => {
//         goToPage(POSTS_PAGE);
//       })
//       .catch((error) => {
//         console.error("Ошибка добавления поста:", error);
//         errorEl.textContent = "Не удалось опубликовать пост";
//       })
//       .finally(() => {
//         isLoading = false;
//         render();
//       })
//       });
//   };
//   render();
// }

// onAddPostClick({
//   description: "Описание картинки",
//   imageUrl: "https://image.png",
// });
