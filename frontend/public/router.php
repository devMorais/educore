<?php
/**
 * EduCore root dispatcher.
 * On LiteSpeed/CloudLinux, mod_rewrite sets REQUEST_URI to the rewritten path
 * (/router.php). REDIRECT_REQUEST_URI holds the original browser URI.
 * We restore it so Symfony/Laravel computes the correct route.
 */
$uri = $_SERVER['REDIRECT_REQUEST_URI']
    ?? $_SERVER['ORIG_REQUEST_URI']
    ?? $_SERVER['REQUEST_URI']
    ?? '/';

if (str_starts_with($uri, '/api')) {
    // Fix $_SERVER so Laravel's Symfony Request sees the original path
    $_SERVER['REQUEST_URI'] = $uri;
    $_SERVER['SCRIPT_NAME'] = '/router.php';
    $_SERVER['PHP_SELF']    = '/router.php';
    require __DIR__ . '/backend/public/index.php';
} else {
    // Angular SPA — serve index.html for all non-API routes
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
}
