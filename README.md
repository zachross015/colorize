# Colorize
###### A jQuery script for adding some <span style = 'color:#98c379;'>color</span> to your life.

## Table of contents
 - [Overview](#overview)
 - [Setup](#setup)
 - [Options](#options)

## Overview
A small jquery plugin for bringing some color to your websites. Colorize provides a friendly and easy way to shoot colors across your words.

## Setup
1. Load jQuery, and then load colorize onto the page.
``` html
    <script src="jquery.js"></script>
    <script src="colorize.js"></script>
```
2. Create an element to color.
```html
    <div class="color-me">It's that simple!</div>
```
3. Run the code.
```js
    $('.color-me').colorize({/* put your options here */})
```
4. Profit!

## Options
| Option         | Description | Default Value |
| ---------------|-------------|---------------|
| color          | (string) Color to be applied to all elements being affected. | 'white'
| textDecoration | (string) Text Decoration(s) to be applied to all element being affected. | 'none'
| direction      | (string) Direction for the colorizer to go in .Forward and backwards are the only ones that work right now. | 'forwards'
| speed          | (number) Speed (in milliseconds) for each element to take effect. | 15
| lock           | (boolean) Prevent any other coloring from interfering with this until it is completed | false
| callback       | (function) Function to be called on completion. |empty function
