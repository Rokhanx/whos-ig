document.getElementById('file-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file) {
        // Verificar que el archivo sea un ZIP
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                JSZip.loadAsync(e.target.result).then(function(zip) {
                    const connectionsFolder = zip.folder("connections");
                    
                    if (connectionsFolder) {
                        const followersAndFollowingFolder = connectionsFolder.folder("followers_and_following");
                        
                        if (followersAndFollowingFolder) {
                            // Leer archivos JSON
                            const followersFile = followersAndFollowingFolder.file("followers_1.json");
                            const followingFile = followersAndFollowingFolder.file("following.json");
                            
                            if (followersFile && followingFile) {
                                Promise.all([
                                    followersFile.async("text"),
                                    followingFile.async("text")
                                ]).then(function(contents) {
                                    try {
                                        const followersData = JSON.parse(contents[0]);
                                        const followingData = JSON.parse(contents[1]).relationships_following;

                                        // Extraer arrays de datos
                                        const followersArray = followersData.flatMap(item => item.string_list_data.map(data => data.value));
                                        const followingArray = followingData.flatMap(item => item.string_list_data.map(data => data.value));

                                        // Comparar datos y mostrar resultados
                                        compareAndDisplayData(followersArray, followingArray);
                                    } catch (jsonError) {
                                        console.error('Error al parsear los datos JSON:', jsonError);
                                    }
                                }).catch(function(error) {
                                    console.error('Error al leer los archivos JSON:', error);
                                });
                            } else {
                                console.error('No se encontraron los archivos JSON en la carpeta "followers_and_following".');
                            }
                        } else {
                            console.error('La carpeta "followers_and_following" no se encontró en "connections".');
                        }
                    } else {
                        console.error('La carpeta "connections" no se encontró en el archivo ZIP.');
                    }
                }).catch(function(error) {
                    console.error('Error al leer el archivo ZIP:', error);
                });
            };
            
            reader.readAsArrayBuffer(file);
        } else {
            console.error('Por favor, selecciona un archivo ZIP válido.');
        }
    } else {
        console.error('Por favor, selecciona un archivo.');
    }
});

function compareAndDisplayData(followersArray, followingArray) {
    try {
        // Comparar los arrays
        const followersSet = new Set(followersArray);
        const followingSet = new Set(followingArray);

        const notFollowingBack = [...followingSet].filter(value => !followersSet.has(value));
        const followingBack = [...followersSet].filter(value => followingSet.has(value));

        // Función para crear una lista numerada
        function createNumberedList(items) {
            return items.map((item, index) => `<li>${index + 1}. ${item}</li>`).join('');
        }

        // Mostrar resultados en paneles
        document.querySelector('#panel-following .panel-content ul').innerHTML = createNumberedList(followingArray);
        document.querySelector('#panel-followers .panel-content ul').innerHTML = createNumberedList(followersArray);
        document.querySelector('#panel-not-following-back .panel-content ul').innerHTML = createNumberedList(notFollowingBack);
        document.querySelector('#panel-following-back .panel-content ul').innerHTML = createNumberedList(followingBack);

        // Funcionalidad de búsqueda en cada panel
        document.getElementById('search-following').addEventListener('input', function() {
            filterList('panel-following', this.value);
        });
        document.getElementById('search-followers').addEventListener('input', function() {
            filterList('panel-followers', this.value);
        });
        document.getElementById('search-not-following-back').addEventListener('input', function() {
            filterList('panel-not-following-back', this.value);
        });
        document.getElementById('search-following-back').addEventListener('input', function() {
            filterList('panel-following-back', this.value);
        });
    } catch (comparisonError) {
        console.error('Error al comparar los datos:', comparisonError);
    }
}

function filterList(panelId, searchText) {
    const panel = document.querySelector(`#${panelId} .panel-content ul`);
    const items = panel.querySelectorAll('li');
    searchText = searchText.toLowerCase();

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchText) ? '' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('tutorial-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageContent = document.getElementById('page-content');
    const pageIndicators = document.querySelectorAll('.page-indicator');

    let currentPage = 0;

    const pages = [
        '<h4>Paso 1:</h4>'+
        '<p>Entramos en la configuracion de tu cuenta y buscamos "Tu ctividad"</p>'+
        '<img src="src/img/img1.png">'+
        '<p>Entramos en "Descargar tu información" abajo del todo</p>'+
        '<img src="src/img/img2.png">',
        '<h4>Paso 2:</h4>'+
        '<p>Luego clickeamos "Descargar o transferir información"</p>'+
        '<img src="src/img/img3.png">'+
        '<p>En caso de que tengamos mas de una cuenta, tendremos que seleccionar la cuenta de la que querramos descargar los datos. Y le damos siguiente</p>'+
        '<p>Seleccionamos "Parte de tu información"</p>'+
        '<img src="src/img/img4.png">',
        '<h4>Paso 3:</h4>'+
        '<p>Buscamos y seleccionamos "Seguidores y seguidos"</p>'+
        '<img src="src/img/img5.png">'+
        '<p>Dejamos seleccionado "Descargar en dispositivo" y le damos siguiente</p>'+
        '<img src="src/img/img6.png">',
        '<p>En intervalo de fechas seleccionamos "Desde el principip"</p>'+
        '<p>Importante seleccionar "JSON" en Formato</p>'+
        '<img src="src/img/img7.png">',
        '<p>Les llegara una notificacion al email una vez se cree el archivo</p>'+
        '<p>Podran descargarlo y subirlo</p>'+
        '<label for="file-upload" class="upload-label">Subir archivo</label>'+
        '<input type="file" id="file-upload" accept=".zip"></input>',
    ];

    function updatePage() {
        pageContent.innerHTML = pages[currentPage];
        pageIndicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentPage);
        });
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === pages.length - 1;
    }

    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        updatePage();
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            updatePage();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < pages.length - 1) {
            currentPage++;
            updatePage();
        }
    });
});
