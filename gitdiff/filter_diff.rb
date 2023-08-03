require 'json'
require 'yaml'


changed_regions = YAML.load(File.read ARGV.first)
    .map do |key, value|
        next File.expand_path(key), value.map do _1['start'].._1['finish'] end
    end.to_h


warnings = JSON.load(File.read ARGV.last)


warnings.each do |warning|

    path = warning['filePath']

    changed = changed_regions[path]

    next unless changed

    warning['messages'].each do |messages|

        line = messages['line']
        range = changed.find do _1 === line end
        next unless range

        pp messages
    end
end

