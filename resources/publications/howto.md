The following

#Prerequisites

Install:

* ``pandoc``
* ``pandoc-citeproc``

#Use

## For all references

Run the ``update-references.bat``

## For ``articles`` only

```
pandoc-citeproc --bib2json articles.bib > articles.json
```

## For ``chapters`` only

```
pandoc-citeproc --bib2json chapters.bib > chapters.json
```

## For ``reports`` only

```
pandoc-citeproc --bib2json reports.bib > reports.json
```