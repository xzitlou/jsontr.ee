/**
 * https://github.com/xzitlou/jsontr.ee - MIT License
 * Generates an SVG visualization of a JSON object as a tree.
 */

function generateJSONTree(json) {
    // Configuración básica de diseño
    const padding = 10; // Espaciado interno de los nodos
    const lineHeight = 18; // Altura de línea para el texto dentro de los nodos
    const fontSize = 12; // Tamaño de la fuente
    const fontFamily = "monospace"; // Familia tipográfica para el texto
    let svgContent = []; // Almacena los elementos SVG que representan los nodos
    let edges = []; // Almacena las líneas que conectan los nodos
    let nodeId = 0; // Contador para asignar un ID único a cada nodo
    let maxX = 0; // Coordenada X máxima del SVG
    let maxY = 0; // Coordenada Y máxima del SVG
    const occupiedPositions = []; // Rastrea posiciones ocupadas para evitar superposición

    /**
     * Mide el ancho de un texto basado en las configuraciones de fuente.
     * @param {string} text - Texto a medir.
     * @returns {number} - Ancho del texto en píxeles.
     */
    function measureTextWidth(text) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = `${fontSize}px ${fontFamily}`;
        return context.measureText(text).width;
    }

    /**
     * Calcula el tamaño de un nodo basado en su contenido.
     * @param {Object|Array|string|number|null} obj - Objeto o valor JSON a visualizar.
     * @returns {Object} - Dimensiones (ancho, alto) y líneas de texto del nodo.
     */
    function calculateNodeSize(obj) {
        const lines = []; // Almacena las líneas de texto del nodo

        // Determina las líneas de texto basadas en el tipo de dato
        if (Array.isArray(obj)) {
            lines.push({ key: "", value: `Array (${obj.length})` });
        } else if (typeof obj === "object" && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                const displayValue = Array.isArray(value)
                    ? `Array (${value.length})`
                    : typeof value === "object"
                    ? "{}"
                    : JSON.stringify(value);
                lines.push({ key, value: displayValue });
            }
        } else {
            lines.push({ key: "", value: JSON.stringify(obj) });
        }

        // Calcula el ancho y el alto del nodo basado en las líneas de texto
        const maxWidth = Math.max(...lines.map(line => measureTextWidth(`${line.key}: ${line.value}`)));
        const height = lines.length * lineHeight + padding * 2;

        return { width: maxWidth + padding * 2, height, lines };
    }

    /**
     * Ajusta la posición de un nodo para evitar superposiciones con otros nodos.
     * @param {number} x - Coordenada X inicial.
     * @param {number} y - Coordenada Y inicial.
     * @param {number} width - Ancho del nodo.
     * @param {number} height - Alto del nodo.
     * @returns {number} - Nueva coordenada Y ajustada.
     */
    function adjustPosition(x, y, width, height) {
        let adjustedY = y;
        const buffer = 10; // Espaciado entre nodos para evitar colisiones

        for (const pos of occupiedPositions) {
            const [ox, oy, ow, oh] = pos;
            if (
                x < ox + ow &&
                x + width > ox &&
                adjustedY < oy + oh &&
                adjustedY + height > oy
            ) {
                adjustedY = oy + oh + buffer; // Ajusta hacia abajo si hay colisión
            }
        }

        // Registra la posición como ocupada
        occupiedPositions.push([x, adjustedY, width, height]);

        return adjustedY;
    }

    /**
     * Construye recursivamente el árbol a partir del JSON y genera nodos y conexiones.
     * @param {Object} obj - Objeto o valor JSON a visualizar.
     * @param {number} x - Coordenada X del nodo actual.
     * @param {number} y - Coordenada Y del nodo actual.
     * @param {string|null} parentId - ID del nodo padre (si lo hay).
     * @param {Object|null} parentPosition - Posición del nodo padre (si lo hay).
     */
    function buildTree(obj, x, y, parentId = null, parentPosition = null) {
        const { width, height, lines } = calculateNodeSize(obj);
        const adjustedY = adjustPosition(x, y, width, height);
        const currentId = `node-${nodeId++}`; // ID único para el nodo actual

        // Genera el contenido del nodo utilizando flexbox para alineación
        const nodeContent = lines
            .map(line => `
                <div style="display: flex;">
                    <span class="json-key" style="margin-right: 5px;">${line.key ? `${line.key}:` : ""}</span>
                    <span class="json-value">${line.value}</span>
                </div>
            `)
            .join("");

        // Agrega el nodo al contenido SVG
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

        // Si el nodo tiene un padre, dibuja una conexión (línea curva)
        if (parentId && parentPosition) {
            const parentCenterX = parentPosition.x + parentPosition.width / 2;
            const parentCenterY = parentPosition.y + parentPosition.height / 2;
            const childCenterX = x;
            const childCenterY = adjustedY + height / 2;

            edges.push(`
                <path d="M${parentCenterX},${parentCenterY} C${(parentCenterX + childCenterX) / 2},${parentCenterY} ${(parentCenterX + childCenterX) / 2},${childCenterY} ${childCenterX},${childCenterY}"
                      style="fill:none;stroke:#475872;stroke-width:1;marker-end:url(#arrowhead);" />
            `);
        }

        let nextYOffset = adjustedY;

        // Procesa los hijos del nodo actual
        lines.forEach(line => {
            const value = obj[line.key];
            const childX = x + width + 100;

            if (Array.isArray(value)) {
                const listNode = { [`${line.key} (${value.length})`]: "Array" };
                buildTree(listNode, childX, nextYOffset, currentId, { x, y: adjustedY, width, height });

                value.forEach((item, index) => {
                    const childY = nextYOffset + index * (lineHeight + 30);
                    buildTree(item, childX + calculateNodeSize(listNode).width + 100, childY, `node-${nodeId - 1}`, {
                        x: childX,
                        y: nextYOffset,
                        width: calculateNodeSize(listNode).width,
                        height: calculateNodeSize(listNode).height,
                    });
                });

                nextYOffset += value.length * (lineHeight + 30) + 50;
            } else if (typeof value === "object" && value !== null) {
                buildTree(value, childX, nextYOffset, currentId, { x, y: adjustedY, width, height });
                nextYOffset += calculateNodeSize(value).height + 50;
            }
        });

        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, nextYOffset);
    }

    // Inicia la construcción del árbol desde el nodo raíz
    buildTree(json, 50, 50);

    // Genera el SVG final
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
