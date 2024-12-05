/**
 * https://github.com/xzitlou/jsontr.ee - MIT License
 * Genera una visualización SVG de un objeto JSON como un árbol.
 * @param {Object} json - El objeto JSON que se va a visualizar.
 * @returns {string} - Un string que contiene el SVG generado.
 */
function generateJSONTree(json) {
    const padding = 10; // Espaciado interno de cada nodo
    const lineHeight = 18; // Altura de cada línea de texto
    const fontSize = 12; // Tamaño de la fuente de texto
    const fontFamily = "monospace"; // Tipo de fuente a usar
    let svgContent = []; // Contenido SVG que se generará
    let edges = []; // Almacena las conexiones entre nodos
    let nodeId = 0; // Contador para identificar nodos
    let maxX = 0; // Ancho máximo alcanzado
    let maxY = 0; // Alto máximo alcanzado
    const occupiedPositions = []; // Registro de posiciones ocupadas para evitar solapamientos

    /**
     * Mide el ancho del texto dado.
     * @param {string} text - El texto a medir.
     * @returns {number} - El ancho del texto en píxeles.
     */
    function measureTextWidth(text) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = `${fontSize}px ${fontFamily}`;
        return context.measureText(text).width; // Devuelve el ancho medido
    }

    /**
     * Calcula el tamaño de un nodo basado en su contenido.
     * @param {Object} obj - El objeto JSON para calcular el tamaño.
     * @returns {Object} - Un objeto con el ancho, altura y líneas del nodo.
     */
    function calculateNodeSize(obj) {
        const lines = []; // Almacena las líneas que se mostrarán en el nodo

        // Manejo de arrays
        if (Array.isArray(obj)) {
            lines.push({key: `(${obj.length})`, value: "Array"});
        } else if (typeof obj === "object" && obj !== null) {
            // Manejo de objetos
            if (Object.keys(obj).length === 0) {
                lines.push({key: "", value: "{}"}); // Manejo de objeto vacío
            } else {
                // Iteración sobre las propiedades del objeto
                for (const [key, value] of Object.entries(obj)) {
                    const displayValue = Array.isArray(value)
                        ? `Array (${value.length})` // Mostrar longitud del array
                        : typeof value === "object"
                            ? "{}" // Indicar que es un objeto
                            : JSON.stringify(value); // Convertir a cadena JSON
                    lines.push({key, value: displayValue}); // Agregar línea
                }
            }
        } else {
            lines.push({key: "", value: JSON.stringify(obj)}); // Para valores primitivos
        }

        const maxWidth = Math.max(...lines.map(line => measureTextWidth(`${line.key}: ${line.value}`)), 0);
        const height = lines.length * lineHeight + padding * 2; // Altura total del nodo

        return {width: Math.max(maxWidth + padding * 2, 0), height: Math.max(height, 0), lines}; // Retorna tamaño del nodo
    }

    /**
     * Ajusta la posición de un nodo y evita solapamientos con otros nodos.
     * @param {number} x - Posición X inicial del nodo.
     * @param {number} y - Posición Y inicial del nodo.
     * @param {number} width - Ancho del nodo.
     * @param {number} height - Altura del nodo.
     * @returns {number} - La posición Y ajustada para evitar solapamientos.
     */
    function adjustPosition(x, y, width, height) {
        let adjustedY = y; // Inicialmente, Y es igual a la Y proporcionada
        const buffer = 10; // Espaciado adicional para evitar solapamiento

        // Comprobar si la nueva posición colisiona con posiciones ocupadas
        for (const pos of occupiedPositions) {
            const [ox, oy, ow, oh] = pos;
            if (
                x < ox + ow &&
                x + width > ox &&
                adjustedY < oy + oh &&
                adjustedY + height > oy
            ) {
                // Si hay colisión, ajustar hacia abajo
                adjustedY = oy + oh + buffer;
            }
        }

        // Registrar la posición ocupada
        occupiedPositions.push([x, adjustedY, width, height]);
        return adjustedY; // Retornar la posición ajustada
    }

    /**
     * Función recursiva para construir el árbol de nodos.
     * @param {Object} obj - El objeto JSON que se va a visualizar.
     * @param {number} x - La posición X del nodo.
     * @param {number} y - La posición Y del nodo.
     * @param {string|null} parentId - ID del nodo padre (si existe).
     * @param {Object|null} parentPosition - Posición del nodo padre (si existe).
     */
    function buildTree(obj, x, y, parentId = null, parentPosition = null) {
        const {width, height, lines} = calculateNodeSize(obj); // Calcular tamaño del nodo
        const adjustedY = adjustPosition(x, y, width, height); // Ajustar posición Y
        const currentId = `node-${nodeId++}`; // Crear ID único para el nodo

        // Genera el contenido del nodo usando divs y display:flex
        const nodeContent = lines.map(line => `
            <div style="display: flex;">
                <span class="json-key" style="margin-right: 5px;">${line.key ? `${line.key}:` : ""}</span>
                <span class="json-value">${line.value}</span>
            </div>
        `).join("");

        // Agregar el nodo al contenido SVG
        svgContent.push(`
        <g id="${currentId}" transform="translate(${x}, ${adjustedY})">
            <rect width="${width}" height="${height}" rx="5" ry="5" style="fill:#f6f8fa;stroke:#475872;stroke-width:1"></rect>
            <foreignObject width="${width}" height="${height}">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${fontFamily}; font-size:${fontSize}px; line-height:${lineHeight}px; padding:${padding}px; box-sizing:border-box;">
                    ${nodeContent}
                </div>
            </foreignObject>
        </g>
    `);

        // Si tiene un nodo padre, agrega una flecha dinámica
        if (parentId && parentPosition) {
            const parentRightX = parentPosition.x + parentPosition.width - 10; // Lado derecho del nodo padre
            const parentCenterY = parentPosition.y + parentPosition.height / 2; // Centro vertical del nodo padre
            const childCenterX = x; // Lado izquierdo del nodo hijo
            const childCenterY = adjustedY + height / 2; // Centro vertical del nodo hijo

            const horizontalPadding = 10; // Espacio horizontal antes de la curva

            // Agregar la conexión entre el nodo padre y el hijo
            edges.push(`
            <path d="M${parentRightX},${parentCenterY} C${(parentRightX + childCenterX - horizontalPadding) / 2},${parentCenterY} ${(parentRightX + childCenterX - horizontalPadding) / 2},${childCenterY} ${childCenterX},${childCenterY}"
                  style="fill:none;stroke:#475872;stroke-width:1;marker-end:url(#arrowhead);" />
        `);
        }

        let nextYOffset = adjustedY; // Inicializar la siguiente posición Y

        // Iterar sobre las líneas para construir nodos hijos
        lines.forEach(line => {
            const key = line.key; // Obtener clave del nodo

            if (key && obj.hasOwnProperty(key)) { // Verificar si el objeto tiene la clave
                const value = obj[key]; // Obtener el valor correspondiente
                const childX = x + width + 100; // Posición X para el hijo

                // Manejo de arrays
                if (Array.isArray(value)) {
                    const listNode = {[`${line.key} (${value.length})`]: "Array"}; // Nodo para el array
                    const listY = nextYOffset; // Y para el nodo del array

                    buildTree(listNode, childX, listY, currentId, {x, y: adjustedY, width, height}); // Construir nodo para el array

                    value.forEach((item, index) => {
                        const childY = nextYOffset + index * (lineHeight + 30); // Posición Y para cada ítem del array
                        buildTree(item, childX + calculateNodeSize(listNode).width + 100, childY, `node-${nodeId - 1}`, {
                            x: childX,
                            y: listY,
                            width: calculateNodeSize(listNode).width,
                            height: calculateNodeSize(listNode).height,
                        });
                    });

                    nextYOffset += value.length * (lineHeight + 30) + 50; // Ajustar Y para el siguiente nodo
                } else if (typeof value === "object" && value !== null) {
                    const nestedParentNode = {[line.key]: "Object"}; // Nodo para el objeto anidado
                    const nestedParentY = nextYOffset; // Y para el nodo padre anidado

                    // Crear un nodo para el nombre de la propiedad que contiene el objeto anidado
                    buildTree(nestedParentNode, childX, nestedParentY, currentId, {x, y: adjustedY, width, height});

                    // Crear los nodos hijos del objeto anidado
                    buildTree(value, childX + calculateNodeSize(nestedParentNode).width + 100, nestedParentY, `node-${nodeId - 1}`, {
                        x: childX,
                        y: nestedParentY,
                        width: calculateNodeSize(nestedParentNode).width,
                        height: calculateNodeSize(nestedParentNode).height,
                    });

                    nextYOffset += calculateNodeSize(value).height + 50; // Ajustar Y después de procesar el objeto anidado
                }
            } else if (Array.isArray(obj)) { // Verifica si el root del JSON es un Array, entonces renderiza los nodos hijos
                const listY = nextYOffset; // Y para el nodo del array
                obj.forEach((item, index) => {
                    const childX = x + width + 100; // Posición X para el hijo

                    if (typeof item === "object" && item !== null) {
                        // Crear los nodos hijos del objeto anidado
                        buildTree(item, childX, nextYOffset, currentId, {
                            x: x,
                            y: listY,
                            width: width,
                            height: height,
                        });

                        nextYOffset += calculateNodeSize(item).height + 30; // Ajustar Y después de procesar el objeto anidado
                    } else if (Array.isArray(item)) {
                        const listNode = {[`(${item.length})`]: "Array"}; // Nodo para el array

                        buildTree(listNode, childX, nextYOffset, currentId, {x, y: adjustedY, width, height}); // Construir nodo para el array

                        item.forEach((subitem, subindex) => {
                            const childY = nextYOffset + subindex * (lineHeight + 30); // Posición Y para cada ítem del array
                            buildTree(subitem, childX + calculateNodeSize(listNode).width + 100, childY, `node-${nodeId - 1}`, {
                                x: childX,
                                y: listY,
                                width: calculateNodeSize(listNode).width,
                                height: calculateNodeSize(listNode).height,
                            });
                        });

                        nextYOffset += item.length * (lineHeight + 30) + 50; // Ajustar Y para el siguiente nodo
                    } else {
                        buildTree(item, childX, nextYOffset, currentId, {
                            x: x,
                            y: listY,
                            width: width,
                            height: height,
                        });

                        nextYOffset += calculateNodeSize(item).height + 30;
                    }
                });
            }
        });

        // Ajustar `maxY` y `maxX` para el SVG
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, nextYOffset);
    }

    // Iniciar la construcción del árbol con el JSON proporcionado
    buildTree(json, 50, 50);

    // Retornar el contenido SVG generado
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${maxX + 150}" height="${maxY + 150}">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" style="fill:#475872;" />
                </marker>
            </defs>
            ${edges.join("")}
            ${svgContent.join("")}
        </svg>
    `;
}