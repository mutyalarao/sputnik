# sputnik
Builder Program to transform relations into graphs from a Peoplesoft database

## Features
 * Runs on **Node.js** web server and stores the relations into a No SQL database, **Orient DB**
 * Create schema files for various table sets (eg.Security, Global Payroll, All Tools records etc.)
 * Separate config files for credentials of a PS instance/Orient DB instanec
 * Can be invoked from command line pointing to the schema file and the PS database 
 * GUI to view the relations has been developed as a separate project- Sputnik_UI
 * Very helpful during upgrade projects to check the impacts of any given object( record/rule etc) visually

## Limitations
 * currently it supports only Oracle database
 * Not real-time. Any updates to the data falling in the schema requires this builder program to be run again
 
## To Do
 1. Fix the 'unparseable date' issue
 2. Fix the date being stored 1 day prior (01-01-1900 as 31-12-1899)
 
