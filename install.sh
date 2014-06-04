# Clean up and install.

# Usage:
# 0. Login to the on remote server.
# 1. clone the git repo. $ git pull hierarchal_pie
# 2. navigate into the working copy. $ cd ncr002-dataanalysis
# 3. Run this script $ ./install.sh
# 4. if necessary create some .htaccess files, define some Apache passwords and edit httpd.conf.

sudo cp ./distribution/nectar_visualisation.tgz /var/www
cd /var/www
sudo tar -xvf nectar_visualisation.tgz
sudo cd nectar_visualisation/
sudo rm static/js/._*
sudo rm static/img/._*
sudo rm static/css/._*
sudo rm static/._*
sudo rm data/._*
sudo rm media/._*
sudo rm scripts/._*