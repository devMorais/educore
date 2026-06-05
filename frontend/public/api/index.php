<?php
/**
 * EduCore API entry point.
 * Apache/LiteSpeed serves this file for all /api/* requests (real directory, no rewrite).
 * REQUEST_URI arrives as /api/auth/register (original, no modification).
 * We override SCRIPT_NAME so Symfony computes getBaseUrl()='' and
 * getPathInfo()='/api/auth/register', which matches Laravel's api routes.
 */
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF']    = '/index.php';
require __DIR__ . '/../backend/public/index.php';
