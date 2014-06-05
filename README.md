nectar_visualisation
====================

Some visualisation of NeCTAR statistics. Mainly HTML and Javascript.

Deployment
--------------------

Copy the file nectar_visualisation.tgz to the web server. This can be done directly from the code repository like so:

wget https://code.vpac.org/gitorious/ncr002-dataanalysis/ncr002-dataanalysis/blobs/raw/f1535db848baa2785ae6c0fccd426cfed634c7ad/distribution/nectar_visualisation.tgz

Note: check the git repository to obtain the latest updated URL for the RAW file nectar_visualisation.tgz

Un pack the archive file  using the command:

tar -zxvf nectar_visualisation.tgz

Then move the entire directory to the web server documents directory.
Some invisible files can be deleted.

 Alternatively run git clone to obtain the entire source code including the install.sh script.
 Then run install.sh.

For security install basic http password authentication by modifying https.conf
to support .htaccess files. Create a password file as well.

Verify correct installation by navigating to:
 http://my.domain.com/nectar_visualisation/allocation_visualisation2.html 
 http://my.domain.com/nectar_visualisation/allocation_visualisation3.html 
 
Build Instructions
--------------------

Cloning the respository into a local directory:

git clone git@code.vpac.org:ncr002-dataanalysis/ncr002-dataanalysis.git

Run the script build.sh or build3.sh in place. The resulting artefact will be found in the distribution folder.

Version History
--------------------

By git tag name:

Version: sunburst_v1
Features: 
	(a) Sunburst.
	(b) Legend for projects.
	(c) Name labels inside sectors.
	(d) Mouseover shows name in centre.
	(e) Clicking shows details in a table.

Version: hpie_v1
Features: 
	(a) Hierarchical pie.
	(b) External to circumference labels for projects.
	(c) Labels for allocation values inside sectors.
	(d) Mouseover shows name for small allocations.
	(e) Clicking at lowest level shows projects in a master/details panel.
	(f) Breadcrumbs.




