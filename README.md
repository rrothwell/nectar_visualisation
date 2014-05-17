nectar_visualisation
====================

Some visualisation of NeCTAR statistics. Mainly HTML and Javascript.

Deployment
--------------------

Copy the file nectar_visualisation.tgz to the web server. This can be done directly from the code repository like so:

wget https://code.vpac.org/gitorious/ncr002-dataanalysis/ncr002-dataanalysis/blobs/raw/f1535db848baa2785ae6c0fccd426cfed634c7ad/distribution/nectar_visualisation.tgz

Un pack the archive file  using the command:

tar -zxvf nectar_visualisation.tgz

Then move the entire directory to the web server documents directory.

Verify correct installation by navigating to:
 http://my.domain.com/nectar_visualisation/allocation_visualisation2.html 

Build Instructions
--------------------

Cloning the respository into a local directory:

git clone git@code.vpac.org:ncr002-dataanalysis/ncr002-dataanalysis.git

Run the script build.sh in place. The resulting artefact will be found in the distribution folder.




