# Resource Injection Model
```js
const injections = [
    /*
      for each link with type 'text/html' and property 'contains: mathml'
        inject resource '/lib/mathjax.js' in a <script>, as the last element in <body>
    */
    {
        predicates: [
            {
                type: 'text/html',
                properties: {
                    contains: 'mathml'
                }
            }
        ],
        resources: [
            {
                href: '/lib/mathjax.js',
                type: 'application/javascript',
                target: 'body',
                insertion: 'append'
            }
        ]
    },
    /*
      for each link with type 'text/html' or type 'application/xhtml+xml'
        inject resource '/rs/epubReadingSystem.js' in a <script>, as the last element in <body>
        inject resource '/readium-css/ReadiumCSS-before.css' in a <link rel='stylesheet'>, as the first element in <head>
        inject resource '/readium-css/ReadiumCSS-after.css' in a <link rel='stylesheet'>, as the last element in <head>
    */
    {
        predicates: [
            {
                type: 'text/html'
            },
            {
                type: 'application/xhtml+xml'
            }
        ],
        resources: [
            {
                href: '/rs/epubReadingSystem.js',
                type: 'application/javascript',
                target: 'head',
                insertion: 'prepend'
            },
            {
                href: '/readium-css/ReadiumCSS-before.css',
                type: 'text/css',
                target: 'head',
                insertion: 'prepend',
                preload: true
            },
            {
                href: '/readium-css/ReadiumCSS-after.css',
                type: 'text/css',
                target: 'head',
                insertion: 'append',
                preload: true
            }
        ]
    }
]
```
