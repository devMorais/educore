<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | D-01: o frontend Angular (localhost:4200) usa withCredentials: true em
    | todas as chamadas HTTP. Isso exige supports_credentials = true aqui, e
    | por regra do navegador, allowed_origins NÃO pode ser '*' quando
    | supports_credentials é true — precisa listar as origens explicitamente.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:4200',
        'https://educore.test',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];