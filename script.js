const cityInput = document.getElementById('city-input');
const cityList = document.getElementById('city-list');
const addButton = document.getElementById('add-city-btn');
const cities = [];
const cidadesCalculo = []; // Array para armazenar as cidades em ordem

let selectedCity = null;

function initAutocomplete() {
    const autocomplete = new google.maps.places.Autocomplete(cityInput, {
        types: ['(cities)'],
        componentRestrictions: { country: 'br' }
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.address_components) return;

        // Procurando por cidade e estado
        let city = '';
        let state = '';

        // Itera sobre os componentes do endereço para encontrar a cidade e o estado
        place.address_components.forEach(component => {
            if (component.types.includes('locality')) {
                city = component.long_name;  // Cidade
            }
            if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name;  // Estado
            }
        });

        if (city && state) {
            selectedCity = `${city}, ${state}`;
        }

        // Se encontrou cidade e estado, armazene e limpa o input
        if (selectedCity) {
            cityInput.value = selectedCity;
        }
    });
}



addButton.addEventListener('click', () => {
    if (selectedCity) {
        cities.push(selectedCity);
        renderCities();
        cityInput.value = '';
        selectedCity = null;
    } else {
        alert('Por favor, selecione uma cidade válida da lista.');
    }
});


function renderCities() {
    cityList.innerHTML = '';
    cidadesCalculo.length = 0; // Limpa o array sempre que renderiza

    cities.forEach((city, index) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <span>${city}</span>
            <div>
                <button class="btn btn-md btn-outline-dark me-1" onclick="moveUp(${index})"><i class="bi bi-arrow-up-square"></i></button>
                <button class="btn btn-md btn-outline-dark me-1" onclick="moveDown(${index})"><i class="bi bi-arrow-down-square"></i></button>
                <button class="btn btn-md btn-outline-danger" onclick="removeCity(${index})"><i class="bi bi-trash"></i></button>
            </div>
        `;
        cityList.appendChild(li);

        // Adiciona a cidade ao array "cidadesCalculo"
        cidadesCalculo.push(city);
    });

    // Atualiza o contador de cidades
    const cityCount = document.getElementById('city-count');
    cityCount.textContent = `Total de cidades: ${cities.length}`;

    // Exibe ou esconde o botão de gerar relatório
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (cities.length >= 3) {
        generateReportBtn.disabled = false;
        generateReportBtn.classList.remove('btn-outline-danger');
        generateReportBtn.classList.add('btn-success');
    } else {
        generateReportBtn.disabled = true;
        generateReportBtn.classList.remove('btn-success');
        generateReportBtn.classList.add('btn-outline-danger');
    }

    // Mostrar ou esconder botão "Limpar Tudo"
    const limparBtn = document.getElementById('limpar-tudo-btn');
    if (cities.length >= 3) {
        limparBtn.classList.remove('d-none');
    } else {
        limparBtn.classList.add('d-none');
    }
}


function moveUp(index) {
    if (index === 0) return;
    [cities[index - 1], cities[index]] = [cities[index], cities[index - 1]];
    renderCities();
}

function moveDown(index) {
    if (index === cities.length - 1) return;
    [cities[index + 1], cities[index]] = [cities[index], cities[index + 1]];
    renderCities();
}

function removeCity(index) {
    cities.splice(index, 1);
    renderCities();
}

// Inicializa quando o DOM estiver pronto
window.addEventListener('load', () => {
    if (google.maps && google.maps.places) {
        initAutocomplete();
    } else {
        console.error('Google Maps API não carregada corretamente.');
    }
});



function coletarDadosFormulario() {
    return {
        cidades: [...cidadesCalculo],
        dadosSaida: {
            data_saida: "01/01/1000",
            horario_inicio: "00:00",
            horario_fim: "00:00",
            duracao_almoco: "00:00",
            ignorar_domingos: "true"
        }
    };
}

function enviarParaN8N(dados) {
    fetch('LINK-FLUXO-N8N', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    })
    .then(res => res.json())  // Converte a resposta para JSON
    .then(data => {
        if (data && data[0] && data[0].html) {
            // Se o campo 'html' existir na resposta, insere o conteúdo no modal
            document.getElementById('modal-body-content').innerHTML = data[0].html;
            const resultadoModal = new bootstrap.Modal(document.getElementById('resultadoModal'));
            resultadoModal.show();
        } else {
            // Caso o HTML não seja encontrado na resposta, exibe uma mensagem de erro
            document.getElementById('modal-body-content').innerHTML = '<p>Erro: conteúdo HTML não encontrado na resposta.</p>';
        }
    })
    .catch(err => {
        console.error("Erro ao enviar para o N8N:", err);
        alert("Erro ao comunicar com a API.");
        document.getElementById('modal-body-content').innerHTML = '<p>Erro ao carregar os dados. Tente novamente mais tarde.</p>';
    });
}



function gerarRelatorio() {
    const botao = document.getElementById('generate-report-btn');
    botao.disabled = true;
    const textoOriginal = botao.textContent;
    botao.textContent = "Gerando...";

    const dados = coletarDadosFormulario();
    enviarParaN8N(dados);

    setTimeout(() => {
        botao.textContent = textoOriginal;
        botao.disabled = false;
    }, 7000);
}


  async function salvarComoPDF() {
    const { jsPDF } = window.jspdf;

    const elemento = document.getElementById("modal-body-content");

    // Aguarda o canvas ser renderizado
    const canvas = await html2canvas(elemento, {
      scale: 2, // aumenta a resolução
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");

    // Tamanho da folha A4 em mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Tamanho da imagem em pixels
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    // Conversão de pixels para mm
    const pxToMm = pageWidth / imgWidthPx;
    const imgHeightMm = imgHeightPx * pxToMm;

    // Redimensiona se a imagem for maior que a página
    const finalHeight = imgHeightMm > pageHeight ? pageHeight : imgHeightMm;

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, finalHeight);
    pdf.save("roteiro.pdf");
  }



  function imprimirModal() {
    const conteudo = document.getElementById("modal-body-content").innerHTML;

    const janelaImpressao = window.open('', '', 'width=800,height=600');
    janelaImpressao.document.write(`
          ${conteudo}
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () {
                window.close();
              };
            };
          <\/script>
    `);
    janelaImpressao.document.close();
  }
  

  async function adicionarRoteiro(nomeRoteiro) {
    try {
        const response = await fetch('roteiros.json');
        const todosRoteiros = await response.json();

        const cidadesDoRoteiro = todosRoteiros[nomeRoteiro];

        if (!Array.isArray(cidadesDoRoteiro)) {
            alert(`Roteiro "${nomeRoteiro}" não encontrado ou inválido.`);
            return;
        }

        cidadesDoRoteiro.forEach(cidade => {cities.push(cidade);});

        renderCities();
    } catch (error) {
        console.error(`Erro ao carregar o roteiro ${nomeRoteiro}:`, error);
        alert("Erro ao carregar os roteiros.");
    }
}

function limparTudo() {
    if (confirm("Tem certeza que deseja apagar todas as cidades da lista?")) {
        cities.length = 0;
        renderCities();
    }
}




new Sortable(cityList, {
    animation: 150,
    handle: 'li',
    onEnd: function (evt) {
        if (evt.oldIndex === evt.newIndex) return;

        // Reorganiza o array cities para refletir a nova ordem
        const movedItem = cities.splice(evt.oldIndex, 1)[0];
        cities.splice(evt.newIndex, 0, movedItem);

        renderCities(); // Re-renderiza a lista (reaplica botões e índices)
    }
});

