import { USER_POSTS_PAGE } from '../routes.js'
import { renderHeaderComponent } from './header-component.js'
import { posts, goToPage } from '../index.js'
import { formatDistanceToNow } from ' https://cdn.jsdelivr.net/npm/date-fns@3/+esm'
import * as ruLocale from ' https://cdn.jsdelivr.net/npm/date-fns@3/locale/ru/+esm'

export function renderPostsPageComponent({ appEl, user }) {
    // @TODO: реализовать рендер постов из api
    console.log('Актуальный список постов:', posts)

    /**
     * @TODO: чтобы отформатировать дату создания поста в виде "19 минут назад"
     * можно использовать https://date-fns.org/v2.29.3/docs/formatDistanceToNow
     */
    // (images/like-${post.isLiked ? 'active' : 'not-active'}.svg")
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
                    ${formatDistanceToNow(new Date (post.createdAt), {
                      addSuffix: true,
                      locale: ruLocale.default
                    })}
                    </p>
                  </li>
                  `,
                    )
                    .join('')}
                </ul>
              </div>`


    appEl.innerHTML = appHtml

    renderHeaderComponent({
        element: document.querySelector('.header-container'),
        user,
    })

    document.querySelectorAll('.post-header').forEach((userEl) => {
            userEl.addEventListener('click', () => {
                console.log('Clicked user:', userEl.dataset.userId)
                goToPage(USER_POSTS_PAGE, { userId: userEl.dataset.userId })
            })
        })
}


