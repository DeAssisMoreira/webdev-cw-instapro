import { USER_POSTS_PAGE } from '../routes.js'
import { renderHeaderComponent } from './header-component.js'
import { posts, goToPage } from '../index.js'
// import { formatDistanceToNow } from 'date-fns';
// import { ru } from 'date-fns/locale/ru';

export function renderPostsPageComponent({ appEl, user }) {
    // @TODO: реализовать рендер постов из api
    console.log('Актуальный список постов:', posts)

    /**
     * @TODO: чтобы отформатировать дату создания поста в виде "19 минут назад"
     * можно использовать https://date-fns.org/v2.29.3/docs/formatDistanceToNow
     */
    // 29 строка (images/like-${post.isLiked ? 'active' : 'not-active'}.svg")
    const appHtml = `
              <div class="page-container">
                <div class="header-container"></div>
                <ul class="posts">
                ${posts
                    .map(
                        (post) => `
                  <li class="post">
                    <div class="post-header" data-user-id="${post.user.id}">
                        <img src="${
                            post.user.imageUrl
                        }" class="post-header__user-image">
                        <p class="post-header__user-name">${post.user.name}</p>
                    </div>
                    <div class="post-image-container">
                      <img class="post-image" src="${post.imageUrl}">
                    </div>
                    <div class="post-likes">
                      <button data-post-id="${post.id}" class="like-button">
                      <img src="./assets/images/${
                          post.isLiked
                              ? 'like-active.svg'
                              : 'like-not-active.svg'
                      }"> 
                      </button>
                      <p class="post-likes-text">
                        Нравится: <strong>${post.likes.length}</strong>
                      </p>
                    </div>
                    <p class="post-text">
                      <span class="user-name">${post.user.name}</span>
                      ${post.description}
                    </p>
                    <p class="post-date">
                    ${formatDate(post.createdAt)}
                    </p>
                  </li>
                  `,
                    )
                    .join('')}
                </ul>
              </div>`

    // Временное решение с датой
    function formatDate(dateString) {
        const date = new Date(dateString)
        return (
            date.toLocaleDateString() +
            ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        )
    }

    appEl.innerHTML = appHtml

    renderHeaderComponent({
        element: document.querySelector('.header-container'),
        user,
    })
    document.querySelectorAll('.posts-header').forEach((userEl) => {
        userEl.addEventListener('click', () => {
            goToPage(USER_POSTS_PAGE, { userId: userEl.dataset.userId })
        })
    })
}
// for (let userEl of document.querySelectorAll(".post-header")) {
//   userEl.addEventListener("click", () => {
//     goToPage(USER_POSTS_PAGE, {
//       userId: userEl.dataset.userId});
//   });
// }
