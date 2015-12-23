module.exports = function(grunt) {

    grunt.initConfig({
        rsync: {
        	dev: {
                options: {
                    src: "/vagrant/",
                    dest: "/home/vagrant",
                    recursive: true,
                    delete: true,
                    exclude: ["node_modules", ".*"],
                    event: ['changed', 'added', 'deleted']             
                }
        	},
            host: {
                options: {
                    src: "/home/vagrant/",
                    dest: "/vagrant",
                    recursive: true,
                    delete: true,
                    exclude: ["node_modules", ".*"],
                    event: ['changed', 'added', 'deleted']
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-rsync");
    
    grunt.registerTask('default', ['rsync:dev']);
    grunt.registerTask('update-host', ['rsync:host']);
};