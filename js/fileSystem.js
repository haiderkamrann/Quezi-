document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('myModal');
    const btn = document.getElementById('myBtn');
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('userForm');
    const userTableBody = document.querySelector('#userTable tbody');
    const idHeader = document.getElementById('idHeader');
    const createdAtHeader = document.getElementById('createdAtHeader');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const searchBar = document.getElementById('searchBar');

    let editingUserId = null;
    let sortDirection = 'asc';
    let sortColumn = 'id';
    let currentPage = 1;
    const usersPerPage = 3;
    let totalPages = 0;

    btn.onclick = function () {
        form.reset();
        editingUserId = null;
        modal.style.display = 'block';
    };

    span.onclick = function () {
        modal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    form.onsubmit = async function (event) {
        event.preventDefault();
        const formData = new FormData(form);

        searchBar.value = '';

        try {
            const method = editingUserId ? 'PUT' : 'POST';
            const url = editingUserId ? `/users/${editingUserId}` : '/users';

            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (response.ok) {
                form.reset();
                modal.style.display = 'none';
                fetchUsers(sortColumn, sortDirection, currentPage);
            } else if (response.status === 400) {
                const errorMessage = await response.text();
                alert(errorMessage);
            } else {
                console.error('Failed to save user');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    idHeader.addEventListener('click', () => {
        sortColumn = 'id';
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        fetchUsers(sortColumn, sortDirection, currentPage);
    });

    createdAtHeader.addEventListener('click', () => {
        sortColumn = 'createdAt';
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        fetchUsers(sortColumn, sortDirection, currentPage);
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchUsers(sortColumn, sortDirection, currentPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchUsers(sortColumn, sortDirection, currentPage);
        }
    });

    async function fetchUsers(sortColumn = 'id', sortDirection = 'asc', page = 1, searchQuery = '') {
        try {
            const response = await fetch('/users');
            if (response.ok) {
                let users = await response.json();

                if (searchQuery) {
                    users = users.filter(user => {
                        return (
                            user.id.toString().includes(searchQuery) ||
                            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    });
                }

                users.sort((a, b) => {
                    if (sortColumn === 'id') {
                        return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
                    } else if (sortColumn === 'createdAt') {
                        return sortDirection === 'asc' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt);
                    }
                });

                totalPages = Math.ceil(users.length / usersPerPage);
                const paginatedUsers = users.slice((page - 1) * usersPerPage, page * usersPerPage);

                if (paginatedUsers.length === 0 && currentPage > 1) {
                    currentPage = 1;
                    fetchUsers(sortColumn, sortDirection, currentPage, searchQuery);
                    return;
                }

                userTableBody.innerHTML = '';
                paginatedUsers.forEach(user => {
                    const userIds = document.getElementById(`${user.id}`);
                    if(userIds){
                        return;
                    }
                    userTableBody.innerHTML += `
                        <tr>
                            <td id=${user.id}>${user.id}</td>
                            <td>${user.firstName}</td>
                            <td>${user.lastName}</td>
                            <td>${user.email}</td>
                            <td>
                            ${user.profilePicture ?
                            `<img src="/uploads/${user.profilePicture}" class="profile-pic" alt="Profile Picture" onclick="enlargeImage(this)">`
                            : 'No Picture Available'}
                            </td>
                            <td>${user.createdAt}</td>
                            <td>${user.updatedAt}</td>
                            <td class='flex'>
                            <button class="edit-btn" data-id="${user.id}">
                            <i class="fa-solid fa-pen" style="color: black;"></i>
                            </button>
                            <button class="delete-btn" data-id="${user.id}">
                            <i class="fa-solid fa-trash" style="color: black;"></i>
                            </button>
                            </td>
                        </tr>
                    `;
                });

                prevPageBtn.disabled = currentPage === 1;
                nextPageBtn.disabled = currentPage === totalPages;

                // Clear existing pagination buttons
                pageNumbers.innerHTML = '';

                // Display first page button
                if (currentPage > 3) {
                    createPageButton(1);
                    if (currentPage > 4) {
                        const ellipsis = document.createElement('span');
                        ellipsis.textContent = '...';
                        pageNumbers.appendChild(ellipsis);
                    }
                }

                for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                    createPageButton(i);
                }

                // Display last page button
                if (currentPage < totalPages - 2) {
                    if (currentPage < totalPages - 3) {
                        const ellipsis = document.createElement('span');
                        ellipsis.textContent = '...';
                        pageNumbers.appendChild(ellipsis);
                    }
                    createPageButton(totalPages);
                }

                function createPageButton(page) {
                    const pageNumber = document.createElement('button');
                    pageNumber.textContent = page;
                    pageNumber.className = page === currentPage ? 'active-paginate' : '';
                    pageNumber.addEventListener('click', () => {
                        currentPage = page;
                        fetchUsers(sortColumn, sortDirection, currentPage, searchQuery);
                    });
                    pageNumbers.appendChild(pageNumber);
                }

                // Add event listeners to edit and delete buttons
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = btn.getAttribute('data-id');
                        const user = users.find(u => u.id == id);
                        form.querySelector('[name="firstName"]').value = user.firstName;
                        form.querySelector('[name="lastName"]').value = user.lastName;
                        form.querySelector('[name="email"]').value = user.email;
                        // form.querySelector('[name="password"]').value = user.plainPassword;

                        // Set the editing state
                        editingUserId = user.id;

                        // Show the modal
                        modal.style.display = 'block';
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const id = btn.getAttribute('data-id');
                        try {
                            const response = await fetch(`/users/${id}`, { method: 'DELETE' });
                            if (response.ok) {
                                fetchUsers(sortColumn, sortDirection, currentPage, searchQuery);
                            } else {
                                console.error('Failed to delete user');
                            }
                        } catch (error) {
                            console.error('Error:', error);
                        }
                    });
                });
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    searchBar.addEventListener('input', () => {
        const searchQuery = searchBar.value.trim();
        currentPage = 1;
        fetchUsers(sortColumn, sortDirection, currentPage, searchQuery);
    });

    fetchUsers();
});

function enlargeImage(imageElement) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay-pic');

    overlay.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(enlargedImg);
    };

    document.body.appendChild(overlay);

    const enlargedImg = document.createElement('img');
    enlargedImg.src = imageElement.src;
    enlargedImg.classList.add('enlarged-pic');

    enlargedImg.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(enlargedImg);
    };

    document.body.appendChild(enlargedImg);
}

