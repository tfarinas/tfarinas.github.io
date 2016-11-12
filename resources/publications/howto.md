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
pandoc-citeproc --bib2json articles.bib > articles.json
```