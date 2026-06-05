<?php
/**
 * EduCore root dispatcher.
 * On LiteSpeed/CloudLinux, REQUEST_URI is overwritten with the rewritten path
 * (/router.php) after mod_rewrite fires. The .htaccess captures the original
 * browser URI into ORIG_URI before the rewrite, accessible here as
 * $_SERVER['REDIRECT_ORIG_URI'].
 */
$uri = $_SERVER['REDIRECT_ORIG_URI']   // set by E=ORIG_URI in .htaccess
    ?? $_SERVER['REDIRECT_REQUEST_URI'] // Apache classic fallback
    ?? $_SERVER['REDIRECT_URL']         // some FastCGI configs
    ?? $_SERVER['REQUEST_URI']          // last resort
    ?? '/';

if (str_starts_with($uri, '/api')) {
    // Restore correct REQUEST_URI so Symfony/Laravel routes properly
    $_SERVER['REQUEST_URI'] = $uri;
    $_SERVER['SCRIPT_NAME'] = '/router.php';
    $_SERVER['PHP_SELF']    = '/router.php';
    require __DIR__ . '/backend/public/index.php';
} else {
    // Angular SPA — serve index.html for all non-API routes
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
}
