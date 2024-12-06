# jsontr.ee
Effortlessly visualize JSON structures as interactive and dynamic tree diagrams. [See example](https://jsontr.ee/)

## Description:
jsontr.ee is a lightweight JavaScript library that transforms JSON data into beautifully rendered, interactive tree diagrams using SVG. Designed for simplicity and flexibility, it supports both arrays and nested objects, ensuring clear and intuitive visualizations of complex data structures.

## Features:

- Automatically generates tree diagrams from JSON data.
- Dynamically positions nodes to avoid overlaps.
- Supports arrays and nested objects with labeled parent nodes.
- Interactive SVG-based rendering with customizable styles.
- Lightweight and easy to integrate into any web project.
- Supports callback for setting node colors based on values.

### Perfect for:

- Debugging JSON structures.
- Visualizing API responses.
- Representing hierarchical data.
- Visualising Decision Tree execution paths.

### How to Use

To get started, include the jsontr.ee library in your HTML:
```html
<script src="path/to/jsontr.ee.js"></script>
```

Basic Usage

1. Prepare Your JSON Data:

Ensure you have your JSON data ready. For example:

```javascript
const jsonData = {
    "name": "Lou Alcalá",
    "projects": [
        {
            "name": "JSONtr.ee",
            "description": "JSON Formatter, Validator & Viewer Online | JSONtr.ee",
            "url": "https://jsontr.ee"
        },
        {
            "name": "PixSpeed.com",
            "description": "Image compressor | Compress and optimize WebP, PNG, JPG, JPeG and AVIF",
            "url": "https://pixspeed.com"
        }
    ]
};
```

2. Create a Container for the Diagram:

Add a `<div>` element in your HTML where the diagram will be rendered.

```html
<div id="json-tree"></div>
```

3. Render the Tree Diagram:

Use the jsontr.ee function to visualize the JSON data.

```javascript
const container = document.getElementById('json-tree');
container.innerHTML = generateJSONTree(jsonData);
```

4. You can customize your graph with CSS

```css
/* Change node styles */
rect {
    fill: #ffffff !important; /* background white */
    stroke: #000000 !important; /* border black */
    stroke-width: 2pt !important; /* border width */
}
```  
  
#### Callback Example Page
A callback can be used to customize colors based on logic.  
See callback-example.html  
Use the example.json as input.  
  
## VS Code Extension

You can install this extension directly from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=LouAlcala.json-tree).

or follow these instructions:

1. Open the Extensions view in Visual Studio Code (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2. Search for `JSON Tree Visualizer`
3. Click **Install**.
4. Done! Run the command `Visualize JSON as Tree` from the Command Palette.
