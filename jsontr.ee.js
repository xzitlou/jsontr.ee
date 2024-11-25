function generateJSONTree(json) {
    const padding = 10;
    const lineHeight = 18;
    const fontSize = 12;
    const fontFamily = "monospace";
    let svgContent = [];
    let edges = [];
    let nodeId = 0;
    let maxX = 0; // Ancho máximo alcanzado
    let maxY = 0; // Alto máximo alcanzado
    const occupiedPositions = []; // Registro de posiciones ocupadas

    function measureTextWidth(text) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = `${fontSize}px ${fontFamily}`;
        return context.measureText(text).width;
    }

    function calculateNodeSize(obj) {
        const lines = [];
        if (Array.isArray(obj)) {
            lines.push({ key: "", value: JSON.stringify(obj) });
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

        const maxWidth = Math.max(...lines.map(line => measureTextWidth(`${line.key}: ${line.value}`)));
        const height = lines.length * lineHeight + padding * 2;

        return { width: maxWidth + padding * 2, height, lines };
    }

    function adjustPosition(x, y, width, height) {
        let adjustedY = y;
        const buffer = 10; // Espaciado adicional para evitar solapamiento

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

        return adjustedY;
    }

    function buildTree(obj, x, y, parentId = null, parentPosition = null) {
        const { width, height, lines } = calculateNodeSize(obj);
        const adjustedY = adjustPosition(x, y, width, height);
        const currentId = `node-${nodeId++}`;

        // Agregar contenido del nodo al SVG
        const nodeContent = lines
            .map((line, index) => {
                const yOffset = padding + lineHeight * index;
                return `
                <span class="json-line" style="display:block; position:absolute; top:${yOffset}px; left:${padding}px;">
                    <span class="json-key">${line.key}:</span>
                    <span class="json-value">${line.value}</span>
                </span>
            `;
            })
            .join("");

        svgContent.push(`
            <g id="${currentId}" transform="translate(${x}, ${adjustedY})">
                <rect width="${width}" height="${height}" rx="5" ry="5" style="fill:#f6f8fa;stroke:#475872;stroke-width:1"></rect>
                <foreignObject width="${width}" height="${height}">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${fontFamily}; font-size:${fontSize}px; line-height:${lineHeight}px; position:relative;">
                        ${nodeContent}
                    </div>
                </foreignObject>
            </g>
        `);

        // Si tiene un nodo padre, agrega una flecha dinámica
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

        lines.forEach(line => {
            const value = obj[line.key];
            const childX = x + width + 100;

            if (Array.isArray(value)) {
                const listNode = { [`${line.key} (${value.length})`]: "Array" };
                const listY = nextYOffset;

                buildTree(listNode, childX, listY, currentId, { x, y: adjustedY, width, height });

                value.forEach((item, index) => {
                    const childY = nextYOffset + index * (lineHeight + 30);
                    buildTree(item, childX + calculateNodeSize(listNode).width + 100, childY, `node-${nodeId - 1}`, {
                        x: childX,
                        y: listY,
                        width: calculateNodeSize(listNode).width,
                        height: calculateNodeSize(listNode).height,
                    });
                });

                nextYOffset += value.length * (lineHeight + 30) + 50;
            } else if (typeof value === "object" && value !== null) {
                const nestedParentNode = { [line.key]: "Object" };
                const nestedParentY = nextYOffset;

                // Crear un nodo para el nombre de la propiedad que contiene el objeto anidado
                buildTree(nestedParentNode, childX, nestedParentY, currentId, { x, y: adjustedY, width, height });

                // Crear los nodos hijos del objeto anidado
                buildTree(value, childX + calculateNodeSize(nestedParentNode).width + 100, nestedParentY, `node-${nodeId - 1}`, {
                    x: childX,
                    y: nestedParentY,
                    width: calculateNodeSize(nestedParentNode).width,
                    height: calculateNodeSize(nestedParentNode).height,
                });

                nextYOffset += calculateNodeSize(value).height + 50;
            }
        });

        // Ajustar `maxY` y `maxX` para el SVG
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, nextYOffset);
    }

    buildTree(json, 50, 50);

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
