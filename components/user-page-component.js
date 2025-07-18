import { USER_POSTS_PAGE } from '../routes.js'
import { renderHeaderComponent } from './header-component.js'
import { goToPage } from '../index.js'

export function renderUserPostsPageComponent({ appEl, user, posts, page }) {
    const isUserPostsPage = page === USER_POSTS_PAGE
    const currentUser =
        isUserPostsPage && posts.length > 0 ? posts[0].user : null

    const appHtml = `
        <div class="page-container">
            <div class="header-container"></div>
            ${
                currentUser
                    ? `
                <div class="posts-user-header">
                    <img src="${currentUser.imageUrl}" class="posts-user-header__user-image">
                    <p class="posts-user-header__user-name">${currentUser.name}</p>
                </div>
            `
                    : ''
            }
            <ul class="posts">
                ${posts
                    .map(
                        (post) => `
                    <li class="post">
                        <div class="post-header" data-user-id="${post.user.id}">
                            <img src="${post.user.imageUrl}" class="post-header__user-image">
                            <p class="post-header__user-name">${post.user.name}</p>
                        </div>
                        <div class="post-image-container">
                            <img class="post-image" src="${post.imageUrl}">
                        </div>
                        <div class="post-likes">
                            <button data-post-id="${post.id}" class="like-button">
                                <img src="./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}"> 
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
        </div>
    `

    appEl.innerHTML = appHtml

    renderHeaderComponent({
        element: document.querySelector('.header-container'),
        user,
    })

    setTimeout(() => {
        document.querySelectorAll('.post-header').forEach((userEl) => {
            userEl.addEventListener('click', () => {
                console.log('Clicked user:', userEl.dataset.userId)
                goToPage(USER_POSTS_PAGE, { userId: userEl.dataset.userId })
            })
        })
    }, 10)

    function formatDate(dateString) {
        const date = new Date(dateString)
        return (
            date.toLocaleDateString() +
            ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        )
    }
};
